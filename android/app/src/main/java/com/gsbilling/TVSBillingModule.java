package com.gsbilling; // replace com.your-app-name with your app’s name

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.Map;
import java.util.HashMap;

import android.os.Environment;
import android.util.Log;
import com.facebook.react.bridge.Callback;
import android.app.ProgressDialog;
import com.ngx.BluetoothPrinter;
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

import com.zcs.sdk.Printer;
import com.zcs.sdk.SdkResult;
import com.zcs.sdk.print.PrnStrFormat;
import com.zcs.sdk.print.PrnTextStyle;
import com.zcs.sdk.DriverManager;
import com.zcs.sdk.SdkResult;
import com.zcs.sdk.Sys;
import com.zcs.sdk.print.PrnTextFont;


import com.zcs.sdk.SdkData;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import java.util.Iterator;
import java.util.Objects;
import java.util.concurrent.ExecutorService;


public class TVSBillingModule extends ReactContextBaseJavaModule {

  ProgressDialog progressDialog;
  private Sys mSys;

  public static BluetoothPrinter mBtp = BluetoothPrinter.INSTANCE;
  private String mConnectedDeviceName = "";
  public static final String title_connecting = "connecting...";
  public static final String title_connected_to = "connected: ";
  public static final String title_not_connected = "not connected";
  private DriverManager mDriverManager;
  private Printer mPrinter;
    private boolean isSupportCutter = false;


  private ReactApplicationContext context;

  TVSBillingModule(ReactApplicationContext context) {
    super(context);
    this.context = context;
  }

  @Override
  public String getName() {
    return "TVSBillingModule";
  }

  @ReactMethod
  public void santhePrint(
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
      Double totalBasic,
      Double discountBasic,
      ReadableArray discountData,
      Double grandTotal,
      Double taxableData,
      Double taxAmount,
      ReadableArray cgstGroups,
      Callback errorCallback,
      Callback successCallback
  ) {    
      try {
        initSdk();
        if (mPrinter == null) {
        Log.e("TVSBillingModule", "Printer object is null! Cannot proceed with printing.");
        return;
          }
          int printStatus = mPrinter.getPrinterStatus();
          boolean isSupportCutter = mPrinter.isSuppoerCutter();
          if (printStatus == SdkResult.SDK_PRN_STATUS_PAPEROUT) {
            Toast.makeText(getCurrentActivity(), "Out of paper", Toast.LENGTH_SHORT).show();
          }else{
            String separator = "-----------------------------------------\n";
            DecimalFormat f = new DecimalFormat("##.00");
            PrnStrFormat format = new PrnStrFormat();
            format.setTextSize(25);
            format.setAli(Layout.Alignment.ALIGN_CENTER);
            format.setStyle(PrnTextStyle.NORMAL);
            format.setFont(PrnTextFont.MONOSPACE);

            mPrinter.setPrintAppendString("TAX INVOICE", format);
            mPrinter.setPrintAppendString(title, format);
            mPrinter.setPrintAppendString(orgname, format);
            mPrinter.setPrintAppendString(address1, format);
            mPrinter.setPrintAppendString(address2, format);
            mPrinter.setPrintAppendString("GSTIN:" + gstino, format);
            mPrinter.setPrintAppendString(cin_no, format);
            StringBuilder stringBuilder = new StringBuilder();
            stringBuilder.append("Date: " + date + " Time: " + time + "\n");
            stringBuilder.append("Bill No: " + billNo + "\n");
            stringBuilder.append(separator);
            stringBuilder.append("\n");

            stringBuilder.append("Items    Qty   Rate    Amt\n");
            stringBuilder.append(separator);
            stringBuilder.append("\n");
            for (int i = 0; i < billData.size(); i++) {
              ReadableMap map = billData.getMap(i);
              int quantity = map.getInt("qty");
              String basicAmt = map.getString("basic_rate");
              Double basic = Double.parseDouble(basicAmt);

              String name = map.getString("product_name");
              String hsnCode = map.getString("hsn_code");
              stringBuilder.append("" + name + "\n");
              stringBuilder.append("HSN Code: " + hsnCode + "\n");
              stringBuilder.append("\t\t\t\t\t" + quantity + "\t\t\t" + basic + "\t\t\t" + f.format(quantity * basic) + "\n");
              System.out.println("-------------___+++++__++______" + name);

            }
            stringBuilder.append(separator);
            stringBuilder.append("\n");
            
            stringBuilder.append("Tot Basic :" + f.format(totalBasic) + "\n");
            stringBuilder.append("Discount  :" + f.format(discountBasic) + "\n");
            stringBuilder.append("Taxable   :" + f.format(taxableData) + "\n");
            stringBuilder.append("Tax       :" + f.format(taxAmount) + "\n");
            stringBuilder.append(separator);
            stringBuilder.append("\n");

            for (int i = 0; i < cgstGroups.size(); i++) {
              ReadableMap map = cgstGroups.getMap(i);
              Double basic = map.getDouble("amount");
              String cgst = map.getString("cgst");
              if (basic > 0.00) {
                stringBuilder.append("CGST " + cgst + "%" + ":" + f.format(basic) + "\n");
                stringBuilder.append("SGST " + cgst + "%" + ":" + f.format(basic) + "\n");
              }

            }

            stringBuilder.append(separator);
            stringBuilder.append("\n");
            for (int i = 0; i < discountData.size(); i++) {
              ReadableMap map = discountData.getMap(i);
              String itemName = map.getString("item_name");
              int freeQty = map.getInt("item_qty");

              stringBuilder.append("" + itemName + "\t" + "\tOffer of\t" + freeQty + "\tQty" + "\n");
            }
            format.setAli(Layout.Alignment.ALIGN_NORMAL);
            mPrinter.setPrintAppendString(stringBuilder.toString(), format);

            format.setStyle(PrnTextStyle.NORMAL);
            format.setFont(PrnTextFont.MONOSPACE);
           
            stringBuilder.append(separator);
            stringBuilder.append("\n");
            format.setAli(Layout.Alignment.ALIGN_CENTER);
            mPrinter.setPrintAppendString("Grand Total:" + grandTotal,  format);
            format.setAli(Layout.Alignment.ALIGN_NORMAL);
            mPrinter.setPrintAppendString("--------------------------------", format);
            format.setAli(Layout.Alignment.ALIGN_CENTER);
            mPrinter.setPrintAppendString("Computer generated invoice, hence signature not required", format);
            mPrinter.setPrintAppendString("Thank You", format);

           mPrinter.setPrintAppendString("\n\n\n", format);

            mPrinter.setPrintStart();
            try {
            Thread.sleep(500); // Small delay before cutting
            mPrinter.openPrnCutter((byte) 1);
             Log.e("TVSBillingModule", "Printed successfully");
            } catch (Exception e) {
             Log.e("TVSBillingModule", "Failed to cut paper: "+ e.getMessage());

            }
          }

      // System.out.println("*****************************************" + isSupportCutter);
      // successCallback.invoke("success");
    }

    catch (Exception e) {
      e.printStackTrace();
      System.out.println("ppppppppppppppppppppppppppp" + e);
    }
    }


  private void initSdk() {
    mDriverManager = DriverManager.getInstance();
    mSys = mDriverManager.getBaseSysDevice(); // Ensure mSys is initialized

    if (mSys == null) {
        Log.e("TVSBillingModule", "Sys device initialization failed!");
        return;
    }

    int status = mSys.sdkInit();
    if (status != SdkResult.SDK_OK) {
        mSys.sysPowerOn();
        try {
            Thread.sleep(1000); // Allow time for the system to power on
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        status = mSys.sdkInit();
    }

    if (status != SdkResult.SDK_OK) {
        Log.e("TVSBillingModule", "SDK initialization failed!");
        return;
    }

    mSys.showDetailLog(true);

    // Initialize the Printer
    mPrinter = mDriverManager.getPrinter();

    if (mPrinter == null) {
        Log.e("TVSBillingModule", "Printer initialization failed!");
    }
}

}