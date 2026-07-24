package com.gsbilling; // replace your-app-name with your app’s name
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class BillingManager implements ReactPackage {

   @Override
   public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
       return Collections.emptyList();
   }

   @Override
   public List<NativeModule> createNativeModules(
           ReactApplicationContext reactContext) {
       List<NativeModule> modules = new ArrayList<>();

       modules.add(new NGXBillingModule(reactContext));
       modules.add(new TVSBillingModule(reactContext));
       modules.add(new UrovoBillingModule(reactContext));
       modules.add(new IminiBillingModule(reactContext));
       modules.add(new NyxBillingModule(reactContext));

       return modules;
   }

}