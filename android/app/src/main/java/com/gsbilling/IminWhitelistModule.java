package com.gsbilling;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class IminWhitelistModule extends ReactContextBaseJavaModule {

    private static final String TAG = "IminWhitelist";
    private final ReactApplicationContext reactContext;

    public IminWhitelistModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "IminWhitelist";
    }

    @ReactMethod
    public void addToWhitelist(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available");
                return;
            }

            if (!Settings.System.canWrite(activity)) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS);
                intent.setData(Uri.parse("package:" + activity.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(intent);
                promise.reject("NO_PERMISSION", "WRITE_SETTINGS permission not granted");
                return;
            }

            boolean result = Settings.System.putString(activity.getContentResolver() , "imin_system_add" , "com.gsbilling");

            Log.d(TAG, "Add to whitelist result: " + result);
            if (result) {
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error adding to whitelist: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void removeFromWhitelist(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available");
                return;
            }

            boolean result = Settings.System.putString(
                    activity.getContentResolver(),
                    "imin_system_remove",
                    activity.getPackageName()
            );

            Log.d(TAG, "Remove from whitelist result: " + result);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error removing from whitelist: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void clearWhitelist(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available");
                return;
            }

            boolean result = Settings.System.putString(
                    activity.getContentResolver(),
                    "imin_system_clear",
                    "clear"
            );

            Log.d(TAG, "Clear whitelist result: " + result);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error clearing whitelist: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }
}
