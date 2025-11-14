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
        final String sep = "--------------------------------------------------------------\n";

        // Header
        print.setAlignment(1); // center
        if (showTax) {
            print.setTextSize(26);
            print.setTextStyle(Typeface.BOLD);
            print.printText("TAX INVOICE\n");
        }

        print.setTextSize(30);
        print.setTextStyle(Typeface.BOLD);
        print.printText((title != null ? title : "") + "\n");

        print.setTextSize(22);
        print.setTextStyle(Typeface.BOLD);
        if (orgname != null && !orgname.isEmpty()) {
            print.printText(orgname + "\n");
        } else {
            print.printAndFeedPaper(20);
        }

        print.setTextStyle(Typeface.NORMAL);
        print.printText((address1 != null ? address1 : "") + "\n");
        print.printAndFeedPaper(2);
        print.printText((address2 != null ? address2 : "") + "\n");
        print.printAndFeedPaper(2);
        if (gstino != null && !gstino.isEmpty()) print.printText("GSTIN: " + gstino + "\n");
        if (cin_no != null && !cin_no.isEmpty() && !"0".equals(cin_no)) {
            print.printText("CIN: " + cin_no + "\n");
        }

        // Bill meta
        print.setAlignment(0); // left
        print.setTextStyle(Typeface.NORMAL);
        print.printText("\nDate: " + (date != null ? date : "") + "                Time: " + (time != null ? time : "") + "\n");
        print.printAndFeedPaper(2);
        print.printText("Bill No: " + (billNo != null ? billNo : "") + "\n");
        print.printText(sep);

        // Column header
        String header = String.format(Locale.US, "%-18s %-8s %-8s %s\n", "Item Name", "Qty", "Rate", "Amt");
        print.printText(header);
        print.printText(sep);

        // Items
        print.setTextSize(20);
        if (billData != null) {
            for (int i = 0; i < billData.size(); i++) {
                ReadableMap map = billData.getMap(i);
                if (map == null) continue;

                String name = toTitleCase(map.hasKey("product_name") ? map.getString("product_name") : "");
                String hsn = map.hasKey("hsn_code") ? map.getString("hsn_code") : "";

                double qty = getQuantityAsDouble(map);
                double rate = 0.0;
                double amount = 0.0;

                try {
                    String basicRate = map.hasKey("basic_rate") ? map.getString("basic_rate") : "0";
                    rate = Double.parseDouble(basicRate);
                } catch (Throwable ignore) {}

                amount = qty * rate;

                // Name line
                print.setTextStyle(Typeface.BOLD);
                print.printText(name + "\n");

                // HSN (optional)
                if (showTax && hsn != null && !hsn.isEmpty()) {
                    print.setTextStyle(Typeface.NORMAL);
                    print.printText("HSN Code: " + hsn + "\n");
                }

                // Details line
                print.setTextStyle(Typeface.NORMAL);
                String details = String.format(Locale.US, "\t\t\t\t\t\t\t %.2f        %.2f        %.2f\n", qty, rate, amount);
                print.printText(details);
                print.printAndFeedPaper(5);
            }
        }

        // Totals
        print.printText(sep);

        if (showTax) {
            print.setTextSize(22);
            print.printText("Tot Basic : " + (totalBasic != null ? totalBasic : "0") + "\n");
            print.printText("Taxable   : " + (taxableData != null ? taxableData : "0") + "\n");
            print.printText("Tax       : " + (taxAmount != null ? taxAmount : "0") + "\n");
            print.printText(sep);

            if (cgstGroups != null) {
                for (int i = 0; i < cgstGroups.size(); i++) {
                    ReadableMap m = cgstGroups.getMap(i);
                    if (m == null) continue;
                    double basic = 0.0;
                    String cgst = "0";
                    try { basic = m.getDouble("amount"); } catch (Throwable ignore) {}
                    try { cgst = m.getString("cgst"); } catch (Throwable ignore) {}
                    if (basic > 0.0) {
                        print.printText("CGST " + cgst + "% : " + money.format(basic) + "\n");
                        print.printText("SGST " + cgst + "% : " + money.format(basic) + "\n");
                    }
                }
            }
        }

        print.printText(sep);
        print.setTextSize(30);
        print.setAlignment(1);
        print.setTextStyle(Typeface.BOLD);
        print.printText("Grand Total: " + (grandTotal != null ? grandTotal : "0") + "\n");

        print.setTextSize(20);
        print.setAlignment(1);
        print.printText(sep);

        // Customer info
        print.setAlignment(0);
        print.setTextStyle(Typeface.NORMAL);
        if (custName != null && !custName.isEmpty())  print.printText("Customer Name : " + custName + "\n");
        if (custMobile != null && !custMobile.isEmpty()) print.printText("Customer Ph   : " + custMobile + "\n");
        if (gstNumber != null && !gstNumber.isEmpty()) print.printText("Customer GST  : " + gstNumber + "\n");

        print.printText(sep);
        print.setAlignment(1);
        print.printText("Computer generated invoice, hence signature not required\n");
        print.printText("Thank You\n");

        // feed
        print.printAndFeedPaper(120);
    }
}
