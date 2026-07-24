package com.gsbilling;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.RemoteException;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.gsbilling.PrinterResult;
import net.nyx.printerservice.print.IPrinterService;
import net.nyx.printerservice.print.PrintTextFormat;

public class NyxBillingModule extends ReactContextBaseJavaModule {

    private static final int RC_SCAN = 0x1000;

    private IPrinterService printerService = null;
    private final ReactApplicationContext reactContext;

    public NyxBillingModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    // ========================= SERVICE CONNECTION =========================

    private final ServiceConnection connService = new ServiceConnection() {
        @Override
        public void onServiceDisconnected(ComponentName name) {
            Log.d("PrinterPlugin", "Printer service disconnected");
            printerService = null;
            Handler handler = createAsyncHandler(Looper.myLooper());
            if (handler != null) {
                handler.postDelayed(() -> bindService(), 2000);
            }
        }

        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            Log.d("PrinterPlugin", "Printer service connected");
            printerService = IPrinterService.Stub.asInterface(service);
        }
    };

    private void bindService() {
        String prefix = getServicePackagePrefix();
        Intent intent = new Intent();
        intent.setPackage(prefix + ".printerservice");
        intent.setAction(prefix + ".printerservice.IPrinterService");
        boolean bind = reactContext.bindService(intent, connService, Context.BIND_AUTO_CREATE);
        if (!bind) {
            Log.e("PrinterPlugin", "Bind printer service failed, please check the device");
        }
    }

    private void unbindService(Context context) {
        context.unbindService(connService);
    }

    // ========================= BROADCAST RECEIVER =========================

    private final BroadcastReceiver qscReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("com.android.NYX_QSC_DATA".equals(intent.getAction())) {
                String qsc = intent.getStringExtra("qsc");
                if (qsc != null) {
                    sendScanResult("QSC_RESULT", qsc);
                }
            }
        }
    };

    private void registerQscScanReceiver() {
        IntentFilter filter = new IntentFilter();
        filter.addAction("com.android.NYX_QSC_DATA");

        if (Build.VERSION.SDK_INT >= 34) {
            reactContext.registerReceiver(qscReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            reactContext.registerReceiver(qscReceiver, filter);
        }
    }

    private void unregisterQscReceiver() {
        reactContext.unregisterReceiver(qscReceiver);
    }

    // ========================= INITIALIZATION =========================

    @Override
    public void initialize() {
        super.initialize();
        bindService();
        reactContext.addActivityEventListener(activityEventListener);
        registerQscScanReceiver();
    }

    @Override
    public void invalidate() {
        unbindService(reactContext);
        unregisterQscReceiver();
        super.invalidate();
    }

    @Override
    public String getName() {
        return "NyxPrinter";
    }

    // ========================= ACTIVITY RESULT =========================

    private final BaseActivityEventListener activityEventListener =
            new BaseActivityEventListener() {
                @Override
                public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
                    if (requestCode == RC_SCAN &&
                            resultCode == Activity.RESULT_OK &&
                            intent != null) {
                        String result = intent.getStringExtra("SCAN_RESULT");
                        if (result != null) {
                            sendScanResult("SCAN_RESULT", result);
                        }
                    }
                }
            };

    private void sendScanResult(String key, String result) {
        WritableMap map = Arguments.createMap();
        map.putString(key, result);
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onScanResult", map);
    }

    // ========================= REACT METHODS =========================

    @ReactMethod
    public void cameraScan(ReadableMap map, Promise promise) {
        try {
            Intent intent = new Intent();
            intent.setComponent(new ComponentName(
                    getServicePackagePrefix() + ".scanner",
                    "net.nyx.scanner.ScannerActivity"
            ));

            if (map != null) {
                if (map.hasKey("title"))
                    intent.putExtra("TITLE", map.getString("title"));
                if (map.hasKey("showAlbum"))
                    intent.putExtra("SHOW_ALBUM", map.getBoolean("showAlbum"));
                if (map.hasKey("playSound"))
                    intent.putExtra("PLAY_SOUND", map.getBoolean("playSound"));
                if (map.hasKey("playVibrate"))
                    intent.putExtra("PLAY_VIBRATE", map.getBoolean("playVibrate"));
            }

            Activity currentActivity = getCurrentActivity();
            if (currentActivity != null) {
                currentActivity.startActivityForResult(intent, RC_SCAN);
            }

        } catch (Exception e) {
            promise.reject(
                    String.valueOf(PrinterResult.SDK_FEATURE_NOT_SUPPORT),
                    PrinterResult.msg(PrinterResult.SDK_FEATURE_NOT_SUPPORT)
            );
        }
    }

    @ReactMethod
    public void getServiceVersion(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            promise.resolve(printerService.getServiceVersion());
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getPrinterVersion(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            String[] res = new String[1];
            int ret = printerService.getPrinterVersion(res);
            if (ret == 0) {
                promise.resolve(res[0]);
            } else {
                promise.reject(String.valueOf(ret), PrinterResult.msg(ret));
            }
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getPrinterStatus(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            int ret = printerService.getPrinterStatus();
            if ((ret < -1200 && ret > -1300) || ret == 0) {
                promise.resolve(ret);
            } else {
                promise.reject(String.valueOf(ret), PrinterResult.msg(ret));
            }
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void paperOut(int px, Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.paperOut(px), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void paperBack(int px, Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.paperBack(px), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void printText(String text, ReadableMap style, Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.printText(text, convertTextStyle(style)), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void printText2(String text, ReadableMap style, int textWidth, int align, Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.printText2(text, convertTextStyle(style), textWidth, align), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void printBarcode(String data, int width, int height, int textPosition, int align, Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.printBarcode(data, width, height, textPosition, align), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void printQrCode(String data, int width, int height, int align, Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.printQrCode(data, width, height, align), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void printBitmap(String data, int type, int align, Promise promise) {
        if (checkPrinterService(promise)) return;
        Bitmap bitmap = convertBase64Bitmap(data);
        try {
            handleResult(printerService.printBitmap(bitmap, type, align), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void printRasterData(String data, Promise promise) {
        if (checkPrinterService(promise)) return;
        byte[] bytes = Base64.decode(data, Base64.DEFAULT);
        try {
            handleResult(printerService.printRasterData(bytes), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void printEscposData(String data, Promise promise) {
        if (checkPrinterService(promise)) return;
        byte[] bytes = Base64.decode(data, Base64.DEFAULT);
        try {
            handleResult(printerService.printEscposData(bytes), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void printTableText(ReadableArray texts, ReadableArray weights,
                               ReadableArray styles, Promise promise) {

        if (checkPrinterService(promise)) return;

        String[] textArr = new String[texts.size()];
        int[] weightArr = new int[weights.size()];
        PrintTextFormat[] styleArr = new PrintTextFormat[styles.size()];

        for (int i = 0; i < texts.size(); i++)
            textArr[i] = texts.getString(i);

        for (int i = 0; i < weights.size(); i++)
            weightArr[i] = weights.getInt(i);

        for (int i = 0; i < styles.size(); i++)
            styleArr[i] = convertTextStyle(styles.getMap(i));

        try {
            handleResult(printerService.printTableText(textArr, weightArr, styleArr), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void printEndAutoOut(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.printEndAutoOut(), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void labelLocate(int labelHeight, int labelGap, Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.labelLocate(labelHeight, labelGap), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void labelPrintEnd(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.labelPrintEnd(), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void labelLocateAuto(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.labelLocateAuto(), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void labelDetectAuto(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.labelDetectAuto(), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void hasLabelLearning(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            promise.resolve(printerService.hasLabelLearning());
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void clearLabelLearning(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.clearLabelLearning(), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void configLcd(int opt, Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.configLcd(opt), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void showLcdBitmap(String data, Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.showLcdBitmap(convertBase64Bitmap(data)), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void openCashBox(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.openCashBox(), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void qscScan(Promise promise) {
        if (checkPrinterService(promise)) return;
        try {
            handleResult(printerService.triggerQscScan(), promise);
        } catch (RemoteException e) {
            promise.reject("REMOTE_EXCEPTION", e.getMessage(), e);
        }
    }

    // ========================= HELPERS =========================

    private boolean checkPrinterService(Promise promise) {
        if (printerService == null) {
            promise.reject(
                    String.valueOf(PrinterResult.SDK_SERVICE_NOT_BIND),
                    PrinterResult.msg(PrinterResult.SDK_SERVICE_NOT_BIND)
            );
            return true;
        }
        return false;
    }

    private void handleResult(int ret, Promise promise) {
        if (ret == 0) {
            promise.resolve(null);
        } else {
            promise.reject(String.valueOf(ret), PrinterResult.msg(ret));
        }
    }

    private PrintTextFormat convertTextStyle(ReadableMap map) {
        PrintTextFormat format = new PrintTextFormat();
        if (map == null) return format;

        if (map.hasKey("textSize")) format.setTextSize(map.getInt("textSize"));
        if (map.hasKey("underline")) format.setUnderline(map.getBoolean("underline"));
        if (map.hasKey("textScaleX")) format.setTextScaleX((float) map.getDouble("textScaleX"));
        if (map.hasKey("textScaleY")) format.setTextScaleY((float) map.getDouble("textScaleY"));
        if (map.hasKey("letterSpacing")) format.setLetterSpacing((float) map.getDouble("letterSpacing"));
        if (map.hasKey("lineSpacing")) format.setLineSpacing((float) map.getDouble("lineSpacing"));
        if (map.hasKey("topPadding")) format.setTopPadding(map.getInt("topPadding"));
        if (map.hasKey("leftPadding")) format.setLeftPadding(map.getInt("leftPadding"));
        if (map.hasKey("align")) format.setAli(map.getInt("align"));

        if (map.hasKey("font")) {
            format.setFont(5);
            format.setPath(map.getString("font"));
        }

        return format;
    }

    private Bitmap convertBase64Bitmap(String data) {
        try {
            String base64Str = data.contains("base64")
                    ? data.substring(data.indexOf(",") + 1)
                    : data;

            byte[] base64 = Base64.decode(base64Str, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(base64, 0, base64.length);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String getServicePackagePrefix() {
        if (Build.VERSION.SDK_INT == 33 &&
                "SC9863A".equals(getSystemProperty("ro.soc.model"))) {
            return "com.incar";
        }
        return "net.nyx";
    }

    private String getSystemProperty(String key) {
        try {
            Class<?> c = Class.forName("android.os.SystemProperties");
            return (String) c.getMethod("get", String.class).invoke(c, key);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private Handler createAsyncHandler(Looper looper) {
        if (looper == null) return null;
        if (Build.VERSION.SDK_INT >= 28) {
            return Handler.createAsync(looper);
        } else {
            return new Handler(looper);
        }
    }
}