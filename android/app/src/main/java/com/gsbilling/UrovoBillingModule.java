package com.gsbilling;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.Map;
import java.util.HashMap;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.device.DeviceManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.drawable.BitmapDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.text.TextUtils;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.widget.EditText;

import androidx.annotation.Nullable;

import com.google.zxing.BarcodeFormat;

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

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import java.util.Iterator;
import java.util.Objects;
import java.util.concurrent.ExecutorService;

import com.urovo.sdk.print.PrintFormat;
import com.urovo.sdk.print.PrinterProviderImpl;
import com.urovo.sdk.utils.FilesUtil;

public class UrovoBillingModule extends ReactContextBaseJavaModule {
  private ReactApplicationContext context;

    private PrinterProviderImpl mPrintManager = null;
    boolean isPrinting = false;


    UrovoBillingModule(ReactApplicationContext context) {
    super(context);
    this.context = context;
  }

  @Override
  public String getName() {
    return "UrovoBillingModule";
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
        new Thread() {

            @Override
            public void run() {
                super.run();
                try {
                    if (isPrinting) {
                        return;
                    }
                    isPrinting = true;
                    mPrintManager = PrinterProviderImpl.getInstance(context);
                    String grayStr = "3";
                    if (TextUtils.isEmpty(grayStr)) {
                        grayStr = "0";
                    }
                    int gray = Integer.parseInt(grayStr);
                    mPrintManager.initPrint();
                    int status = mPrintManager.getStatus();
                    if (status != 0) {
                        isPrinting = false;
                        return;
                    }
                    mPrintManager.setGray(gray);

                    String fontPath = Environment.getExternalStorageDirectory() + "/CALIBRI.ttf";
                    String fontPath1 = Environment.getExternalStorageDirectory() + "/CALIBRI.ttf";

                    

                    //===========================

                    String separator = "-----------------------------------------\n";
                    DecimalFormat f = new DecimalFormat("##.00");
                    mPrintManager.feedLine(1);
                    Bundle format = new Bundle();
                    format.putInt("font", 1);
                    format.putInt("align", 1);
                    format.putBoolean("fontBold", true);
                    format.putString("fontName", fontPath);
                    format.putInt("lineHeight", 10);
                    mPrintManager.addText(format, "TAX INVOICE");
                    mPrintManager.addText(format, title);
                    mPrintManager.addText(format, orgname);
                    mPrintManager.addText(format, address1);
                    mPrintManager.addText(format, address2);
                    mPrintManager.addText(format, "GSTIN:" + gstino);
                    mPrintManager.addText(format, cin_no);
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
                    stringBuilder.append("\t\t" + quantity + "\t" + basic + "\t" + f.format(quantity * basic) + "\n");
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

                    stringBuilder.append("" + itemName + "\tOffer of\t" + "\n" + freeQty + "\tQty" + "\n");
                    }
                    format = new Bundle();
                    format.putBoolean("fontBold", true);
                    format.putInt("font", 1);
                    format.putInt("align", 0);
                    format.putString("fontName", fontPath);
                    mPrintManager.addText(format, stringBuilder.toString());

                    stringBuilder.append(separator);
                    stringBuilder.append("\n");

                    format = new Bundle();
                    format.putInt("font", 1);
                    format.putInt("align", 1);
                    format.putBoolean("fontBold", true);
                    format.putString("fontName", fontPath);
                    format.putInt("lineHeight", 10);
                    mPrintManager.addText(format, "Grand Total:" + grandTotal);
                    mPrintManager.addText(format, "--------------------------------");
                    mPrintManager.addText(format, "Computer generated invoice, hence signature not required");

                    mPrintManager.addText(format, "Thank You");
                    mPrintManager.addText(format, "\n\n\n");
                    mPrintManager.addText(format, "\n\n\n");
                    mPrintManager.addText(format, "\n\n\n");
                    mPrintManager.addText(format, "\n\n\n");
                    mPrintManager.feedLine(1);
                    mPrintManager.feedLine(-1);
                    int iRet = mPrintManager.startPrint();

                    mPrintManager.close();
                    isPrinting = false;
                } catch (Exception e) {
                    e.printStackTrace();
                    isPrinting = false;
                }
            }
        }.start();
    }


@ReactMethod
  public void dummyPrint(){
 new Thread() {

            @Override
            public void run() {
                super.run();
                try {
                    if (isPrinting) {
                        return;
                    }

                    String textToPrint = "TEST STORE";
                    textToPrint =
                    
                    "         VIJAYALAKSHMI VEG         \n" +
                    "     TILAKNAGAR, BANGALORE-41      \n" +
                    "      GSTNO:29ACMFS9925L1Z3        \n" +
                    "            CASH/BILL              \n" +
                    "NO.000525   0  SLM- 0 12-04-25     \n" +
                    "...................................\n" +
                    "DESCRIPTION    QTY  RATE  AMT      \n" +
                    "...................................\n" +
                    "ROTI CURRY     10   100  1000      \n" +
                    "PARCEL         10   5    50        \n" +
                    "...................................\n" +
                    "CASH                 1050.00       \n" +
                    "...................................\n" +
                    "ABOVE PRICES INCLUDE TAXES         \n" +
                    "CGST  @ 2.50% ON 1000  25          \n" +
                    "SGST  @ 2.50% ON 1000  25          \n" +
                    "TTOTAL GST             50          \n" +
                    "THANK YOU...VISIT AGAIN...\n";
                    isPrinting = true;
                    mPrintManager = PrinterProviderImpl.getInstance(context);
                    String grayStr = "3";
                    if (TextUtils.isEmpty(grayStr)) {
                        grayStr = "0";
                    }
                    int gray = Integer.parseInt(grayStr);
                    mPrintManager.initPrint();
                    int status = mPrintManager.getStatus();
                    if (status != 0) {
                        isPrinting = false;
                        return;
                    }
                    mPrintManager.setGray(gray);

                    String fontPath = Environment.getExternalStorageDirectory() + "/CALIBRI.ttf";
                    String fontPath1 = Environment.getExternalStorageDirectory() + "/CALIBRI.ttf";

                     mPrintManager.feedLine(1);
                    Bundle format = new Bundle();
                    format.putInt("font", 1);
                    format.putInt("align", 0);
                    format.putBoolean("fontBold", true);
                    format.putString("fontName", fontPath);
                    format.putInt("lineHeight", 5);
                    mPrintManager.addText(format, textToPrint);

                    mPrintManager.feedLine(1);
                    mPrintManager.feedLine(-1);
                    int iRet = mPrintManager.startPrint();

                    mPrintManager.close();
                    isPrinting = false;
                } catch (Exception e) {
                    e.printStackTrace();
                    isPrinting = false;
                }
            }
        }.start();
                
        
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
      Double totalBasic,
      Double grandTotal,
      Double taxableData,
      Double taxAmount,
      ReadableArray cgstGroups,
      String custName,
      String custMobile,
      String gstNumber,
      Boolean showTax,
      Callback errorCallback,
      Callback successCallback
  ) {
        new Thread() {

            @Override
            public void run() {
                super.run();
                try {
                    if (isPrinting) {
                        return;
                    }
                    isPrinting = true;
                    mPrintManager = PrinterProviderImpl.getInstance(context);
                    String grayStr = "3";
                    if (TextUtils.isEmpty(grayStr)) {
                        grayStr = "0";
                    }
                    int gray = Integer.parseInt(grayStr);
                    mPrintManager.initPrint();
                    int status = mPrintManager.getStatus();
                    if (status != 0) {
                        isPrinting = false;
                        return;
                    }
                    mPrintManager.setGray(gray);

                    String fontPath = Environment.getExternalStorageDirectory() + "/CALIBRI.ttf";
                    String fontPath1 = Environment.getExternalStorageDirectory() + "/CALIBRI.ttf";

                    

                    //===========================

                    String separator = "-----------------------------------------\n";
                    DecimalFormat f = new DecimalFormat("##.00");
                    mPrintManager.feedLine(1);
                    Bundle format = new Bundle();
                    format.putInt("font", 1);
                    format.putInt("align", 1);
                    format.putBoolean("fontBold", true);
                    format.putString("fontName", fontPath);
                    format.putInt("lineHeight", 10);
                    if (showTax) {
                    mPrintManager.addText(format, "TAX INVOICE");
                    }
                    mPrintManager.addText(format, title);
                    mPrintManager.addText(format, orgname);
                    mPrintManager.addText(format, address1);
                    mPrintManager.addText(format, address2);
                    mPrintManager.addText(format, "GSTIN:" + gstino);
                    mPrintManager.addText(format, "CIN:" + cin_no);
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
                    if (showTax) {
                    stringBuilder.append("HSN Code: " + hsnCode + "\n");
                    }
                    stringBuilder.append("\t\t" + quantity + "\t" + basic + "\t" + f.format(quantity * basic) + "\n");
                    System.out.println("-------------___+++++__++______" + name);

                    }
                    stringBuilder.append(separator);
                    stringBuilder.append("\n");
                    if (showTax) {
                    
                    stringBuilder.append("Tot Basic :" + f.format(totalBasic) + "\n");
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
                    }
                    
                    format = new Bundle();
                    format.putBoolean("fontBold", true);
                    format.putInt("font", 1);
                    format.putInt("align", 0);
                    format.putString("fontName", fontPath);
                    mPrintManager.addText(format, stringBuilder.toString());

                    stringBuilder.append(separator);
                    stringBuilder.append("\n");

                    format = new Bundle();
                    format.putInt("font", 1);
                    format.putInt("align", 1);
                    format.putBoolean("fontBold", true);
                    format.putString("fontName", fontPath);
                    format.putInt("lineHeight", 10);
                    mPrintManager.addText(format, "Grand Total:" + grandTotal);
                    mPrintManager.addText(format, "-----------------------------------------");
                    format = new Bundle();
                    format.putBoolean("fontBold", true);
                    format.putInt("font", 1);
                    format.putInt("align", 0);
                    format.putString("fontName", fontPath);
                    if (custName != null && !custName.isEmpty()) {
                        mPrintManager.addText(format, "Customer Name :" + custName);
                    }

                    if (custMobile != null && !custMobile.isEmpty()) {
                        mPrintManager.addText(format, "Customer Ph   :" + custMobile);
                    }

                    if (gstNumber != null && !gstNumber.isEmpty()) {
                        mPrintManager.addText(format, "Customer GST  :" + gstNumber);
                    }
                    mPrintManager.addText(format, "-----------------------------------------");
                    format = new Bundle();
                    format.putInt("font", 1);
                    format.putInt("align", 1);
                    format.putBoolean("fontBold", true);
                    format.putString("fontName", fontPath);
                    format.putInt("lineHeight", 10);
                    mPrintManager.addText(format, "Computer generated invoice, hence signature not required");

                    mPrintManager.addText(format, "Thank You");
                    mPrintManager.addText(format, "\n\n\n");
                    mPrintManager.addText(format, "\n\n\n");
                    mPrintManager.addText(format, "\n\n\n");
                    mPrintManager.addText(format, "\n\n\n");
                    mPrintManager.feedLine(1);
                    mPrintManager.feedLine(-1);
                    int iRet = mPrintManager.startPrint();

                    mPrintManager.close();
                    isPrinting = false;
                } catch (Exception e) {
                    e.printStackTrace();
                    isPrinting = false;
                }
            }
        }.start();
    }
}