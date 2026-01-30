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
import com.facebook.react.bridge.ReadableType;

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


public class NGXBillingModule extends ReactContextBaseJavaModule {

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

  NGXBillingModule(ReactApplicationContext context) {
    super(context);
    this.context = context;
  }

  @Override
  public String getName() {
    return "NGXBillingModule";
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
      Boolean showTax,
      Callback errorCallback,
      Callback successCallback) {
    try {
      mBtp.initService(this.context);

      if (mBtp.getState() != BluetoothPrinter.STATE_CONNECTED) {
        Toast.makeText(getCurrentActivity(), "Printer is not connected", Toast.LENGTH_SHORT).show();
        errorCallback.invoke("failed");
        return;
      }

      // if (mBtp.getState() == BluetoothPrinter.STATE_CONNECTED) {
      // Toast.makeText(getCurrentActivity(), "Printer is connected",
      // Toast.LENGTH_SHORT).show();
      // }
      String separator = "--------------------------------";
      Typeface tf = Typeface.createFromAsset(getCurrentActivity().getAssets(), "fonts/DroidSansMono.ttf");

      DecimalFormat f = new DecimalFormat("0.00");
      TextPaint tp = new TextPaint();
      tp.setTypeface(Typeface.create(tf, Typeface.BOLD));
      tp.setTextSize(20);
      tp.setColor(Color.BLACK);
      mBtp.setPrinterWidth(PrinterWidth.PRINT_WIDTH_48MM);
      if (showTax) {
        mBtp.addText("TAX INVOICE", Layout.Alignment.ALIGN_CENTER, tp);
      }
      mBtp.addText(title, Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText(orgname, Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText(address1, Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText(address2, Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText("GSTIN:" + gstino, Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText(cin_no, Layout.Alignment.ALIGN_CENTER, tp);
      StringBuilder stringBuilder = new StringBuilder();
      stringBuilder.append("Date: " + date + " Time: " + time + "\n");
      stringBuilder.append("Bill No: " + billNo + "\n");
      stringBuilder.append(separator);
      stringBuilder.append("\n");

      // stringBuilder.append("\n");
      stringBuilder.append("Items    Qty   Rate    Amt\n");
      stringBuilder.append(separator);
      stringBuilder.append("\n");
      for (int i = 0; i < billData.size(); i++) {
        ReadableMap map = billData.getMap(i);
        // ReadableMap variantDictionary = map.getMap("name");
        int quantity = map.getInt("qty");
        String basicAmt = map.getString("basic_rate");
        Double basic = Double.parseDouble(basicAmt);

        String name = map.getString("product_name");
        String hsnCode = map.getString("hsn_code");
        stringBuilder.append("" + name + "\n");
        if (showTax && hsnCode != null && !hsnCode.isEmpty()) {
        stringBuilder.append("HSN Code: " + hsnCode + "\n");
        }
        stringBuilder.append("\t\t\t\t\t" + quantity + "\t\t\t" + basic + "\t\t\t" + f.format(quantity * basic) + "\n");
        System.out.println("-------------___+++++__++______" + name);

      }
      stringBuilder.append(separator);
      stringBuilder.append("\n");
      // stringBuilder.append("Tot Items: 2 Amount: 66.50\n");
      // stringBuilder.append("Tot Qty :12 Vat Amt: 3.50\n");
      // stringBuilder.append(" -------------");
      if (showTax) {
      stringBuilder.append("Tot Basic :" + f.format(totalBasic) + "\n");
      stringBuilder.append("Discount  :" + f.format(discountBasic) + "\n");
      stringBuilder.append("Taxable   :" + f.format(taxableData) + "\n");
      stringBuilder.append("Tax       :" + f.format(taxAmount) + "\n");
      }
      stringBuilder.append(separator);
      stringBuilder.append("\n");

      for (int i = 0; i < cgstGroups.size(); i++) {
        ReadableMap map = cgstGroups.getMap(i);
        // String basicAmt = map.getString("amount");
        Double basic = map.getDouble("amount");
        // String amount = map.getString("amount");
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

      TextPaint tp1 = new TextPaint();
      tp1.setTypeface(Typeface.create(tf, Typeface.BOLD));
      tp1.setTextSize(25);
      tp1.setColor(Color.BLACK);
      stringBuilder.append(separator);
      stringBuilder.append("\n");
      mBtp.addText(stringBuilder.toString(), Layout.Alignment.ALIGN_NORMAL, tp);
      mBtp.addText("Grand Total:" + grandTotal, Layout.Alignment.ALIGN_CENTER, tp1);
      mBtp.addText("--------------------------------", Layout.Alignment.ALIGN_NORMAL, tp);
      mBtp.addText("Computer generated invoice, hence signature not required", Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText("Thank You", Layout.Alignment.ALIGN_CENTER, tp1);

      mBtp.addText("\n");
      mBtp.print();

      System.out.println("*****************************************" + mBtp);
      successCallback.invoke("success");
    }

    catch (Exception e) {
      e.printStackTrace();
      System.out.println("ppppppppppppppppppppppppppp" + e);
    }

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
      Callback successCallback) {

    try {
      mBtp.initService(this.context);

      if (mBtp.getState() != BluetoothPrinter.STATE_CONNECTED) {
        Toast.makeText(getCurrentActivity(), "Printer is not connected", Toast.LENGTH_SHORT).show();
        errorCallback.invoke("failed");
        return;
      }

      // if (mBtp.getState() == BluetoothPrinter.STATE_CONNECTED) {
      // Toast.makeText(getCurrentActivity(), "Printer is connected",
      // Toast.LENGTH_SHORT).show();
      // }
      String separator = "--------------------------------";
      Typeface tf = Typeface.createFromAsset(getCurrentActivity().getAssets(), "fonts/DroidSansMono.ttf");

      DecimalFormat f = new DecimalFormat("0.00");
      TextPaint tp = new TextPaint();
      tp.setTypeface(Typeface.create(tf, Typeface.BOLD));
      tp.setTextSize(20);
      tp.setColor(Color.BLACK);
      mBtp.setPrinterWidth(PrinterWidth.PRINT_WIDTH_48MM);
      if (showTax) {
        mBtp.addText("TAX INVOICE", Layout.Alignment.ALIGN_CENTER, tp);
      }
      mBtp.addText(title, Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText(orgname, Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText(address1, Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText(address2, Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText("GSTIN:" + gstino, Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText("CIN:" + cin_no, Layout.Alignment.ALIGN_CENTER, tp);
      StringBuilder stringBuilder = new StringBuilder();
      stringBuilder.append("Date: " + date + " Time: " + time + "\n");
      stringBuilder.append("Bill No: " + billNo + "\n");
      stringBuilder.append(separator);
      stringBuilder.append("\n");

      stringBuilder.append("Items   Qty   Rate    Amt\n");
      stringBuilder.append(separator);
      stringBuilder.append("\n");
      for (int i = 0; i < billData.size(); i++) {
        ReadableMap map = billData.getMap(i);
        double quantity = getQuantityAsDouble(map);
        String basicAmt = map.getString("basic_rate");
        Double basic = Double.parseDouble(basicAmt);

        String name = map.getString("product_name");
        String hsnCode = map.getString("hsn_code");
        stringBuilder.append("" + name + "\n");
        if (showTax) {
       stringBuilder.append("HSN Code: " + hsnCode + "\n");
        }
        stringBuilder.append("\t\t\t\t" + f.format(quantity) + "\t" + f.format(basic) + "\t\t" + f.format(quantity * basic) + "\n");
        System.out.println("-------------___+++++__++______" + name);

      }
      stringBuilder.append(separator);
      stringBuilder.append("\n");
      if (showTax) {
      stringBuilder.append("Tot Basic :" + totalBasic + "\n");
      stringBuilder.append("Taxable   :" + taxableData + "\n");
      stringBuilder.append("Tax       :" + taxAmount + "\n");
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
      }

      stringBuilder.append("\n");

      TextPaint tp1 = new TextPaint();
      tp1.setTypeface(Typeface.create(tf, Typeface.BOLD));
      tp1.setTextSize(25);
      tp1.setColor(Color.BLACK);
      stringBuilder.append(separator);
      stringBuilder.append("\n");
      mBtp.addText(stringBuilder.toString(), Layout.Alignment.ALIGN_NORMAL, tp);
      mBtp.addText("Grand Total:" + grandTotal, Layout.Alignment.ALIGN_CENTER, tp1);
      mBtp.addText("--------------------------------", Layout.Alignment.ALIGN_NORMAL, tp);
      if (custName != null && !custName.isEmpty()) {
          mBtp.addText("Customer Name :" + custName, Layout.Alignment.ALIGN_NORMAL, tp);
      }

      if (custMobile != null && !custMobile.isEmpty()) {
          mBtp.addText("Customer Ph   :" + custMobile, Layout.Alignment.ALIGN_NORMAL, tp);
      }

      if (gstNumber != null && !gstNumber.isEmpty()) {
          mBtp.addText("Customer GST  :" + gstNumber, Layout.Alignment.ALIGN_NORMAL, tp);
      }
      mBtp.addText("--------------------------------", Layout.Alignment.ALIGN_NORMAL, tp);
      mBtp.addText("Computer generated invoice, hence signature not required", Layout.Alignment.ALIGN_CENTER, tp);
      mBtp.addText("Thank You", Layout.Alignment.ALIGN_CENTER, tp1);

      mBtp.addText("\n");
      mBtp.addText("\n");
      mBtp.print();
      System.out.println("*****************************************" + mBtp);
      successCallback.invoke("success");
    }

    catch (Exception e) {
      e.printStackTrace();
      System.out.println("ppppppppppppppppppppppppppp" + e);
    }

  }

  @ReactMethod
  public void onCounterBillGenerateWithToken(
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
          String groupedItems,
          Integer token,
          String custName,
          String custMobile,
          String gstNumber,
          Boolean showTax,
          Callback errorCallback,
          Callback successCallback) {

    try {
      mBtp.initService(this.context);

      if (mBtp.getState() != BluetoothPrinter.STATE_CONNECTED) {
        Toast.makeText(getCurrentActivity(), "Printer is not connected", Toast.LENGTH_SHORT).show();
        errorCallback.invoke("failed");
        return;
      }
      String separator = "--------------------------------";
      Typeface tf = Typeface.createFromAsset(getCurrentActivity().getAssets(), "fonts/DroidSansMono.ttf");

      DecimalFormat f = new DecimalFormat("0.00");
      TextPaint tp = new TextPaint();
      tp.setTypeface(Typeface.create(tf, Typeface.BOLD));
      tp.setTextSize(20);
      tp.setColor(Color.BLACK);
      mBtp.setPrinterWidth(PrinterWidth.PRINT_WIDTH_48MM);

      JSONObject jsonObject = new JSONObject(groupedItems);

      Iterator<String> keys = jsonObject.keys();
      TextPaint tp2 = new TextPaint();
      tp2.setTypeface(Typeface.create(tf, Typeface.BOLD));
      tp2.setTextSize(30);
      tp2.setColor(Color.BLACK);
      StringBuilder stringBuilderGroupItems = new StringBuilder();
      StringBuilder stringBuilderToken = new StringBuilder();

      while (keys.hasNext()) {
        String key = keys.next();
        JSONArray jsonArray = jsonObject.getJSONArray(key);

        mBtp.addText("TOKEN: " + token + "\n", Layout.Alignment.ALIGN_CENTER, tp2);

        stringBuilderGroupItems.append("Date: " + date + " Time: " + time + "\n");
        stringBuilderGroupItems.append("Bill No: " + billNo + "\n");
        stringBuilderGroupItems.append(separator);
        stringBuilderGroupItems.append("\n");
        stringBuilderGroupItems.append("Items" + "\t\t\t\t\t\t\t\t\t\t" + "Qty\n");
        stringBuilderGroupItems.append(separator);
        stringBuilderGroupItems.append("\n");

        for (int i = 0; i < jsonArray.length(); i++) {
          JSONObject item = jsonArray.getJSONObject(i);

          // Access the properties of each object
          String productName = item.getString("product_name");
          // String price = item.getString("price");
          // String productStatus = item.getString("product_status");
          int qty = item.getInt("qty");

          // Do something with the values (e.g., print them)
          stringBuilderGroupItems.append("" + productName + "\t\t\t\t\t" + qty + "\n");

          // System.out.println("Product Name: " + productName);
          // System.out.println("Price: " + price);
          // System.out.println("Status: " + productStatus);


        }
        mBtp.addText(stringBuilderGroupItems.toString(), Layout.Alignment.ALIGN_NORMAL, tp);
        mBtp.addText("\n");
        mBtp.addText("\n");
        mBtp.print();

        stringBuilderGroupItems.setLength(0);  // Reset the StringBuilder to handle the next key
      }
      System.out.println("*****************************************" + mBtp);
      successCallback.invoke("success");
    }

    catch (Exception e) {
      e.printStackTrace();
      System.out.println("ppppppppppppppppppppppppppp" + e);
    }

  }

  @ReactMethod
  public boolean connectprint() {
    try {
      mBtp.initService(this.context);
    } catch (Exception e) {
      e.printStackTrace();
    }
    mBtp.showDeviceList(getCurrentActivity());
    return true;
  }

}