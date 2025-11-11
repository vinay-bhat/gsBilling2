package com.gsbilling;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import android.bluetooth.BluetoothDevice;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Handler;
import android.text.TextUtils;
import android.util.Log;
import android.text.TextPaint;
import java.text.DecimalFormat;

import android.os.Environment;
import android.util.Log;
import com.facebook.react.bridge.Callback;
import android.app.ProgressDialog;
import android.content.res.Configuration;
import android.os.Handler;
import android.annotation.SuppressLint;
import android.os.Message;
import android.widget.Toast;
import android.os.Bundle;
import com.ngx.PrinterWidth;
import android.text.TextPaint;
import android.text.Layout;
import android.graphics.Typeface;
import android.graphics.Color;
import java.util.ArrayList;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import java.text.DecimalFormat;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;


import com.imin.library.SystemPropManager;
import com.imin.printerlib.IminPrintUtils;

public class IminiBillingModule extends ReactContextBaseJavaModule {
    private static final String TAG = "IminiBillingModule";
    private ReactApplicationContext context;
    private IminPrintUtils mIminPrintUtils;
    private IminPrintUtils.PrintConnectType currentConnectionType;
    private boolean isInitialized = false;

    IminiBillingModule(ReactApplicationContext context) {
        super(context);
        this.context = context;
        // Initialize the printer instance immediately
        try {
            mIminPrintUtils = IminPrintUtils.getInstance(context);
            Log.d(TAG, "IminPrintUtils instance created successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to create IminPrintUtils instance: " + e.getMessage());
        }
    }

    @Override
    public String getName() {
        return "IminiBillingModule";
    }

    double getQuantityAsDouble(ReadableMap map) {
    if (!map.hasKey("qty")) {
        return 0.0; // Default if key doesn't exist
    }
    
    ReadableType qtyType = map.getType("qty");
    
    if (qtyType == ReadableType.String) {
        try {
            return Double.parseDouble(map.getString("qty"));
        } catch (NumberFormatException e) {
            return 0.0; // Default if conversion fails
        }
    } else if (qtyType == ReadableType.Number) {
        return map.getDouble("qty");
    }
    
    return 0.0; // Default for other types
}
  

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
        try {
            // Auto-initialize with USB if not initialized
            // if (mIminPrintUtils == null || !isInitialized) {
                Log.d(TAG, "Printer not initialized, auto-initializing with USB...");
                autoInitializeUSB(title, orgname, gstino, address1, address2, cin_no, billData, branchname, billId, billNo, date, time, totalBasic, grandTotal, taxableData, taxAmount, cgstGroups, custName, custMobile, gstNumber, showTax, errorCallback, successCallback);
            
            
        } catch (Exception e) {
            Log.e(TAG, "Error in print sequence: " + e.getMessage());
            // callback.invoke("Error: " + e.getMessage(), null);
        }
    }

    private void autoInitializeUSB(
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
        try {
            // Ensure printer instance exists
            if (mIminPrintUtils == null) {
                mIminPrintUtils = IminPrintUtils.getInstance(context);
                if (mIminPrintUtils == null) {
                    // callback.invoke("Failed to create printer instance", null);
                    return;
                }
            }
            
            Log.d(TAG, "Auto-initializing USB printer...");
            mIminPrintUtils.initPrinter(IminPrintUtils.PrintConnectType.USB);
            currentConnectionType = IminPrintUtils.PrintConnectType.USB;
            
            // Wait 2 seconds then check status and print
            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    try {
                        Log.d(TAG, "Checking printer status after auto-initialization...");
                        int status = mIminPrintUtils.getPrinterStatus(IminPrintUtils.PrintConnectType.USB);
                        Log.d(TAG, "Printer status: " + status);
                        
                        if (status != 0) {
                            String statusMessage = getPrinterStatusMessage(status);
                            // callback.invoke("Printer not ready after initialization: " + statusMessage, null);
                            return;
                        }
                        
                        isInitialized = true;
                        
                        // Print receipt
                        Log.d(TAG, "Printing receipt after auto-initialization...");
                        printReceiptInternal(
                            title,
                            orgname,
                            gstino,
                            address1,
                            address2,
                            cin_no,
                            billData,
                            branchname,
                            billId,
                            billNo,
                            date,
                            time,
                            totalBasic,
                            grandTotal,
                            taxableData,
                            taxAmount,
                            cgstGroups,
                            custName,
                            custMobile,
                            gstNumber,
                            showTax,
                            errorCallback,
                            successCallback
                        );
                        
                        // Cut paper
                        Log.d(TAG, "Cutting paper...");
                        mIminPrintUtils.partialCut();

                        Log.d(TAG, "Receipt printed and cut successfully after auto-initialization");
                        // callback.invoke(null, "Receipt printed and cut successfully");
                        
                    } catch (Exception e) {
                        Log.e(TAG, "Error in auto-initialization print sequence: " + e.getMessage());
                        // callback.invoke("Error: " + e.getMessage(), null);
                    }
                }
            }, 2000);
            
        } catch (Exception e) {
            Log.e(TAG, "Error in auto-initialization: " + e.getMessage());
            // callback.invoke("Error: " + e.getMessage(), null);
        }
    }


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
      Boolean showTax,
      Callback errorCallback,
      Callback successCallback
    ) throws Exception {
        mIminPrintUtils.setTextSize(26);
        mIminPrintUtils.setAlignment(0);
        mIminPrintUtils.setTextStyle(Typeface.NORMAL);
        String separator = "--------------------------------------------------------------\n";
        StringBuilder stringBuilder = new StringBuilder();

      DecimalFormat f = new DecimalFormat("0.00");
      if (showTax) {
        mIminPrintUtils.setTextSize(26);
        mIminPrintUtils.setAlignment(1); // Center align
        mIminPrintUtils.setTextStyle(Typeface.BOLD);
        mIminPrintUtils.printText("TAX INVOICE" + "\n");
      }

      mIminPrintUtils.setTextSize(30);
      mIminPrintUtils.setAlignment(1); // Center align
      mIminPrintUtils.setTextStyle(Typeface.BOLD);
      mIminPrintUtils.printText(title + "\n");

      mIminPrintUtils.setTextSize(22);
      mIminPrintUtils.setAlignment(1); // Center align
      mIminPrintUtils.setTextStyle(Typeface.BOLD);
      if (orgname != null && !orgname.isEmpty()) {
        mIminPrintUtils.printText(orgname + "\n");
      } else {
        mIminPrintUtils.printAndFeedPaper(20); // Add small space if orgname is empty
      }
      mIminPrintUtils.printText(address1 + "\n");
      mIminPrintUtils.printAndFeedPaper(2);
      mIminPrintUtils.printText(address2 + "\n");
      mIminPrintUtils.printAndFeedPaper(2);
      mIminPrintUtils.printText("GSTIN:" + gstino + "\n");
      if (cin_no != null && !cin_no.isEmpty() && !cin_no.equals("0")) {
        mIminPrintUtils.printText("CIN:" + cin_no + "\n");
      }

    //   StringBuilder stringBuilder = new StringBuilder();
    //   stringBuilder.append("\n");
    //   stringBuilder.append("Date: " + date + " Time: " + time + "\n");
    //   stringBuilder.append("Bill No: " + billNo + "\n");
    //   stringBuilder.append(separator);

    //   stringBuilder.append("Items          Qty          Rate             Amt\n");
    //   stringBuilder.append(separator);

        mIminPrintUtils.setAlignment(0); // Left
        mIminPrintUtils.setTextStyle(Typeface.NORMAL);
        mIminPrintUtils.printText("\nDate: " + date + "                Time: " + time + "\n");
        mIminPrintUtils.printAndFeedPaper(2);
        mIminPrintUtils.printText("Bill No: " + billNo + "\n");
        mIminPrintUtils.printText("--------------------------------------------------------------\n");
         String details2 = String.format("%-18s %-8s %-8s %s\n", "Item Name", "Qty", "Rate", "Amt");
        mIminPrintUtils.printText(details2);
        mIminPrintUtils.printText("--------------------------------------------------------------");

        // ===== ITEM LOOP =====
        for (int i = 0; i < billData.size(); i++) {
            ReadableMap map = billData.getMap(i);
            double quantity = getQuantityAsDouble(map);
            String basicAmt = map.getString("basic_rate");
            Double basic = Double.parseDouble(basicAmt);

            String name = map.getString("product_name");
            // Convert name to title case (first letter of each word capital)
            if (name != null && !name.isEmpty()) {
                // Normalize multiple spaces to single space and trim
                name = name.replaceAll("\\s+", " ").trim();
                String[] words = name.toLowerCase().split(" ");
                StringBuilder titleCase = new StringBuilder();
                for (int j = 0; j < words.length; j++) {
                    // Skip empty strings that might result from splitting
                    if (words[j].isEmpty()) continue;
                    if (titleCase.length() > 0) titleCase.append(" ");
                    titleCase.append(words[j].substring(0, 1).toUpperCase()).append(words[j].substring(1));
                }
                name = titleCase.toString();
            }
            String hsnCode = map.getString("hsn_code");

            // 👇 Item name styled separately
            mIminPrintUtils.setTextSize(25);
            mIminPrintUtils.setTextStyle(Typeface.BOLD);
            mIminPrintUtils.setAlignment(0);
            mIminPrintUtils.printText(name + "\n");

            // 👇 Optional HSN Code
            if (showTax) {
                mIminPrintUtils.setTextSize(20);
                mIminPrintUtils.setTextStyle(Typeface.NORMAL);
                mIminPrintUtils.printText("HSN Code: " + hsnCode + "\n");
            }

            // 👇 Item details
            String details = String.format("\t\t\t\t\t\t\t" + " %.2f        %.2f        %.2f\n", quantity, basic, quantity * basic);
            mIminPrintUtils.setTextSize(20);
            mIminPrintUtils.setTextStyle(Typeface.NORMAL);
            mIminPrintUtils.printText(details);

      mIminPrintUtils.printAndFeedPaper(5);

        }

        // ===== TAX & TOTAL =====
        mIminPrintUtils.printText(separator);

    if (showTax) {
        mIminPrintUtils.setTextSize(22);
        mIminPrintUtils.printText("Tot Basic : " + totalBasic + "\n");
        mIminPrintUtils.printText("Taxable   : " + taxableData + "\n");
        mIminPrintUtils.printText("Tax       : " + taxAmount + "\n");
        mIminPrintUtils.printText(separator);

        for (int i = 0; i < cgstGroups.size(); i++) {
            ReadableMap map = cgstGroups.getMap(i);
            double basic = map.getDouble("amount");
            String cgst = map.getString("cgst");
            if (basic > 0.00) {
                mIminPrintUtils.printText("CGST " + cgst + "% : " + f.format(basic) + "\n");
                mIminPrintUtils.printText("SGST " + cgst + "% : " + f.format(basic) + "\n");
            }
        }
    }


        mIminPrintUtils.printText(separator);
        mIminPrintUtils.setTextSize(30);
        mIminPrintUtils.setAlignment(1);
        mIminPrintUtils.setTextStyle(Typeface.BOLD);
        mIminPrintUtils.printText("Grand Total: " + grandTotal + "\n");

        mIminPrintUtils.setTextSize(20);
        mIminPrintUtils.setAlignment(1);
        mIminPrintUtils.printText(separator);


        mIminPrintUtils.setAlignment(0);
        mIminPrintUtils.setTextStyle(Typeface.NORMAL);
        if (custName != null && !custName.isEmpty()) {
            mIminPrintUtils.printText("Customer Name :" + custName);
        }

        if (custMobile != null && !custMobile.isEmpty()) {
            mIminPrintUtils.printText("Customer Ph   :" + custMobile);
        }

        if (gstNumber != null && !gstNumber.isEmpty()) {
            mIminPrintUtils.printText("Customer GST  :" + gstNumber);
        }
        mIminPrintUtils.printText("--------------------------------------------------------------");
        mIminPrintUtils.setAlignment(1);
        mIminPrintUtils.printText("Computer generated invoice, hence signature not required");
        mIminPrintUtils.printText("Thank You");

        mIminPrintUtils.printAndFeedPaper(120);
        }

    

    @ReactMethod
    public void cutPaper(final Callback callback) {
        try {
            if (mIminPrintUtils == null) {
                callback.invoke("Printer not initialized", null);
                return;
            }
            
            mIminPrintUtils.partialCut();
            callback.invoke(null, "Paper cut successfully");
            
        } catch (Exception e) {
            Log.e(TAG, "Error cutting paper: " + e.getMessage());
            callback.invoke("Error: " + e.getMessage(), null);
        }
    }

    @ReactMethod
    public void feedPaper(int lines, final Callback callback) {
        try {
            if (mIminPrintUtils == null) {
                callback.invoke("Printer not initialized", null);
                return;
            }
            
            mIminPrintUtils.printAndFeedPaper(lines);
            callback.invoke(null, "Paper fed successfully");
            
        } catch (Exception e) {
            Log.e(TAG, "Error feeding paper: " + e.getMessage());
            callback.invoke("Error: " + e.getMessage(), null);
        }
    }

    private String getPrinterStatusMessage(int status) {
        switch (status) {
            case 0:
                return "Printer ready";
            case 1:
                return "Printer not connected or not powered";
            case 3:
                return "Printer head open";
            case 7:
                return "Out of paper";
            case 8:
                return "Paper low";
            case 99:
                return "Other error";
            default:
                return "Unknown status: " + status;
        }
    }
}