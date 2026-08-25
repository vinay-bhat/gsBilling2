package com.gsbilling;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Copies a file into the public Downloads folder so it is visible in the
 * phone Files app (not only when browsing Android/data via USB).
 */
public class DatabaseExportModule extends ReactContextBaseJavaModule {

  public DatabaseExportModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "DatabaseExport";
  }

  @ReactMethod
  public void exportToDownloads(String sourcePath, String fileName, Promise promise) {
    try {
      File source = new File(sourcePath);
      if (!source.exists()) {
        promise.reject("ENOENT", "Source DB not found: " + sourcePath);
        return;
      }

      String safeName =
          (fileName == null || fileName.trim().isEmpty())
              ? "pos_exported.db"
              : fileName.trim();

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        String publicPath = exportViaMediaStore(source, safeName);
        promise.resolve(publicPath);
      } else {
        String publicPath = exportLegacy(source, safeName);
        promise.resolve(publicPath);
      }
    } catch (Exception e) {
      promise.reject("EEXPORT", e.getMessage(), e);
    }
  }

  private String exportViaMediaStore(File source, String fileName) throws Exception {
    ContentResolver resolver = getReactApplicationContext().getContentResolver();

    ContentValues values = new ContentValues();
    values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
    values.put(MediaStore.Downloads.MIME_TYPE, "application/octet-stream");
    values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
    values.put(MediaStore.Downloads.IS_PENDING, 1);

    Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
    if (uri == null) {
      throw new Exception("Failed to create Downloads MediaStore entry");
    }

    try (InputStream in = new FileInputStream(source);
        OutputStream out = resolver.openOutputStream(uri)) {
      if (out == null) {
        throw new Exception("Failed to open Downloads output stream");
      }
      byte[] buffer = new byte[8192];
      int len;
      while ((len = in.read(buffer)) > 0) {
        out.write(buffer, 0, len);
      }
      out.flush();
    }

    values.clear();
    values.put(MediaStore.Downloads.IS_PENDING, 0);
    resolver.update(uri, values, null, null);

    return Environment.DIRECTORY_DOWNLOADS + "/" + fileName;
  }

  private String exportLegacy(File source, String fileName) throws Exception {
    File downloadsDir =
        Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
    if (!downloadsDir.exists() && !downloadsDir.mkdirs()) {
      throw new Exception("Cannot create Downloads directory");
    }

    File dest = new File(downloadsDir, fileName);
    if (dest.exists() && !dest.delete()) {
      throw new Exception("Cannot overwrite existing export: " + dest.getAbsolutePath());
    }

    try (InputStream in = new FileInputStream(source);
        OutputStream out = new FileOutputStream(dest)) {
      byte[] buffer = new byte[8192];
      int len;
      while ((len = in.read(buffer)) > 0) {
        out.write(buffer, 0, len);
      }
      out.flush();
    }

    return dest.getAbsolutePath();
  }
}
