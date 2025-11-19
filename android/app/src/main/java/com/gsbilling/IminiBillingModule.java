package com.gsbilling;

import android.graphics.Typeface;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.imin.printerlib.IminPrintUtils;

import java.text.DecimalFormat;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Fast iMin printer bridge:
 * - Initializes once
 * - No artificial delays
 * - Background executor (non-blocking)
 */
public class IminiBillingModule extends ReactContextBaseJavaModule {
    private static final String TAG = "IminiBillingModule";

    private final ReactApplicationContext context;
    private IminPrintUtils print;
    private volatile boolean isInitialized = false;
    private final ExecutorService printExecutor = Executors.newSingleThreadExecutor();

    public IminiBillingModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
        safeInitOnce(); // eager init; harmless if device not ready, we re-check on demand
    }

    @Override
    public String getName() {
        return "IminiBillingModule";
    }

    // ---------- Initialization & Status ----------

    private synchronized void safeInitOnce() {
        try {
            if (print == null) {
                print = IminPrintUtils.getInstance(context);
            }
            if (!isInitialized && print != null) {
                print.initPrinter(IminPrintUtils.PrintConnectType.USB);
                isInitialized = true;
                Log.d(TAG, "Printer initialized (USB).");
            }
        } catch (Throwable t) {
            // we'll retry on first print
            Log.w(TAG, "Printer init deferred: " + t.getMessage());
            isInitialized = false;
        }
    }

    /** Ensure printer is ready. Throws if not. */
    private void ensureReadyOrThrow() throws Exception {
        if (print == null) {
            print = IminPrintUtils.getInstance(context);
        }
        if (!isInitialized) {
            try {
                print.initPrinter(IminPrintUtils.PrintConnectType.USB);
                isInitialized = true;
            } catch (Throwable t) {
                throw new Exception("Failed to initialize printer: " + t.getMessage());
            }
        }

        int status = 99; // unknown default
        try {
            status = print.getPrinterStatus(IminPrintUtils.PrintConnectType.USB);
        } catch (Throwable t) {
            throw new Exception("Could not read printer status: " + t.getMessage());
        }

        if (status != 0) {
            throw new Exception(getPrinterStatusMessage(status));
        }
    }

    // ---------- Helpers ----------

    private double getQuantityAsDouble(ReadableMap map) {
        if (map == null || !map.hasKey("qty")) return 0.0;
        ReadableType t = map.getType("qty");
        try {
            if (t == ReadableType.Number) return map.getDouble("qty");
            if (t == ReadableType.String) return Double.parseDouble(map.getString("qty"));
        } catch (Throwable ignore) {}
        return 0.0;
    }

    private String toTitleCase(@Nullable String s) {
        if (s == null) return "";
        s = s.trim().replaceAll("\\s+", " ");
        if (s.isEmpty()) return s;
        String[] words = s.toLowerCase(Locale.getDefault()).split(" ");
        StringBuilder out = new StringBuilder();
        for (String w : words) {
            if (w.isEmpty()) continue;
            if (out.length() > 0) out.append(" ");
            out.append(Character.toUpperCase(w.charAt(0)))
               .append(w.substring(1));
        }
        return out.toString();
    }

    private String getPrinterStatusMessage(int status) {
        switch (status) {
            case 0:  return "Printer ready";
            case 1:  return "Printer not connected or not powered";
            case 3:  return "Printer head open";
            case 7:  return "Out of paper";
            case 8:  return "Paper low";
            case 99: return "Other error";
            default: return "Unknown status: " + status;
        }
    }

    // ---------- Public API (JS) ----------

    @ReactMethod
    public void onCounterBillGenerate(
            String title,
            String orgname,
            String gstino,
            String address1,
            String address2,
            String cin_no,
            ReadableArray billData,
            String branchname,
            String billId,
            String billNo,
            String date,
            String time,
            String totalBasic,
            String grandTotal,
            String taxableData,
            String taxAmount,
            ReadableArray cgstGroups,
            String custName,
            String custMobile,
            String gstNumber,
            Boolean showTax,
            Callback errorCallback,
            Callback successCallback
    ) {
        printExecutor.execute(() -> {
            try {
                ensureReadyOrThrow();
                printReceiptInternal(
                        title, orgname, gstino, address1, address2, cin_no,
                        billData, branchname, billId, billNo, date, time,
                        totalBasic, grandTotal, taxableData, taxAmount,
                        cgstGroups, custName, custMobile, gstNumber,
                        showTax != null && showTax,
                        errorCallback, successCallback
                );
                // Cut after print
                try { print.partialCut(); } catch (Throwable t) {
                    Log.w(TAG, "partialCut failed: " + t.getMessage());
                }
                if (successCallback != null) successCallback.invoke("Printed");
            } catch (Exception e) {
                Log.e(TAG, "Print failed: " + e.getMessage());
                if (errorCallback != null) errorCallback.invoke(e.getMessage());
            }
        });
    }

    @ReactMethod
    public void cutPaper(final Callback callback) {
        printExecutor.execute(() -> {
            try {
                ensureReadyOrThrow();
                print.partialCut();
                if (callback != null) callback.invoke(null, "Paper cut successfully");
            } catch (Exception e) {
                if (callback != null) callback.invoke("Error: " + e.getMessage(), null);
            }
        });
    }

    @ReactMethod
    public void feedPaper(int lines, final Callback callback) {
        printExecutor.execute(() -> {
            try {
                ensureReadyOrThrow();
                print.printAndFeedPaper(lines);
                if (callback != null) callback.invoke(null, "Paper fed successfully");
            } catch (Exception e) {
                if (callback != null) callback.invoke("Error: " + e.getMessage(), null);
            }
        });
    }

    // ---------- Printing Implementation ----------

    private void printReceiptInternal(
        String title,
        String orgname,
        String gstino,
        String address1,
        String address2,
        String cin_no,
        ReadableArray billData,
        String branchname,
        String billId,
        String billNo,
        String date,
        String time,
        String totalBasic,
        String grandTotal,
        String taxableData,
        String taxAmount,
        ReadableArray cgstGroups,
        String custName,
        String custMobile,
        String gstNumber,
        boolean showTax,
        @Nullable Callback errorCallback,
        @Nullable Callback successCallback
) throws Exception {

    DecimalFormat money = new DecimalFormat("0.00");
    final String SEP = "--------------------------------------------------------------\n";

    // Header (all in one block for speed)
    StringBuilder header = new StringBuilder();
    if (showTax) {
        header.append("TAX INVOICE\n");
    }
    // header.append(title).append("\n");
    print.setTextSize(30);
        print.setTextStyle(Typeface.BOLD);
        print.printText((title != null ? title : "") + "\n");

    if (orgname != null && !orgname.isEmpty()) {
        header.append(orgname).append("\n");
    } else {
        header.append("\n");
    }

    if (address1 != null) header.append(address1).append("\n");
    if (address2 != null) header.append(address2).append("\n");
    if (gstino != null && !gstino.isEmpty()) header.append("GSTIN: ").append(gstino).append("\n");
    if (cin_no != null && !cin_no.isEmpty() && !"0".equals(cin_no))
        header.append("CIN: ").append(cin_no).append("\n");

    header.append("\nDate: ").append(date)
            .append("            Time: ").append(time)
            .append("\nBill No: ").append(billNo)
            .append("\n").append(SEP)
            .append(String.format("%-18s %-8s %-8s %s\n", "Item Name", "Qty", "Rate", "Amt"))
            .append(SEP);

    // Print header (center aligns title block, left-align table rows)
    print.setAlignment(1);
    print.setTextSize(20);
    print.setTextStyle(Typeface.BOLD);
    print.printText(header.toString());

    print.setAlignment(0);
    print.setTextStyle(Typeface.NORMAL);
    print.setTextSize(22);

    // Items (buffered for speed)
    if (billData != null) {
        for (int i = 0; i < billData.size(); i++) {
            ReadableMap map = billData.getMap(i);
            if (map == null) continue;

            // Get data safely
            String rawName = map.hasKey("product_name") ? map.getString("product_name") : "";
            String name = toTitleCase(rawName);
            String hsn = map.hasKey("hsn_code") ? map.getString("hsn_code") : "";
            double qty = getQuantityAsDouble(map);

            double rate = 0.0;
            try {
                String basicRate = map.getString("basic_rate");
                rate = Double.parseDouble(basicRate);
            } catch (Throwable ignore) {}

            double amount = qty * rate;

            // Item Name (28, BOLD)
            print.setTextSize(26);
            print.setTextStyle(Typeface.BOLD);
            print.printText(name + "\n");

            // HSN if enabled
            if (showTax && hsn != null && !hsn.isEmpty()) {
                print.setTextSize(22);
                print.setTextStyle(Typeface.NORMAL);
                print.printText("HSN Code: " + hsn + "\n");
            }

            // Qty/Rate/Amount line
            print.setTextSize(22);
            print.setTextStyle(Typeface.NORMAL);
            print.printText(String.format(Locale.US,
                    "\t\t\t\t\t\t\t %.2f        %.2f        %.2f\n",
                    qty, rate, amount));

            print.printAndFeedPaper(5);
        }
    }

    

    if (showTax) {
        // Totals & Tax Section
    print.printText(SEP);
    print.setTextSize(24);
        print.printText("Tot Basic : " + totalBasic + "\n");
        print.printText("Taxable   : " + taxableData + "\n");
        print.printText("Tax       : " + taxAmount + "\n");
        print.printText(SEP);

        if (cgstGroups != null) {
            for (int i = 0; i < cgstGroups.size(); i++) {
                ReadableMap m = cgstGroups.getMap(i);
                if (m == null) continue;
                double amt = 0;
                String cg = "0";
                try { amt = m.getDouble("amount"); } catch (Throwable ignore) {}
                try { cg = m.getString("cgst"); } catch (Throwable ignore) {}

                if (amt > 0) {
                    print.printText("CGST " + cg + "% : " + money.format(amt) + "\n");
                    print.printText("SGST " + cg + "% : " + money.format(amt) + "\n");
                }
            }
        }
    }

    print.printText(SEP);

    // Grand Total
    print.setAlignment(1);
    print.setTextSize(30);
    print.setTextStyle(Typeface.BOLD);
    print.printText("Grand Total: " + grandTotal + "\n");

    print.setTextSize(22);
    print.printText(SEP);

    // Customer Info
    print.setAlignment(0);
    print.setTextStyle(Typeface.NORMAL);
    if (custName != null && !custName.isEmpty()) print.printText("Customer Name : " + custName + "\n");
    if (custMobile != null && !custMobile.isEmpty()) print.printText("Customer Ph   : " + custMobile + "\n");
    if (gstNumber != null && !gstNumber.isEmpty()) print.printText("Customer GST  : " + gstNumber + "\n");

    // Footer
    print.printText(SEP);
    print.setAlignment(1);
    print.printText("Computer generated invoice,\n");
    print.printText("Signature not required\n");
    print.printText("Thank You\n");

    print.printAndFeedPaper(120);
}

}
