import {Alert, NativeModules, Platform} from 'react-native';
import RNFS from 'react-native-fs';

const {DatabaseExport} = NativeModules;

type ExportOptions = {
  /** When true, skip Alert popups (used as sync-fail backup). */
  silent?: boolean;
};

/** Example: pos_exported_2026-08-10_18-36-45.db */
const buildExportFileName = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `pos_exported_${date}_${time}.db`;
};

/**
 * Copies local SQLite DB to the public Downloads folder so it is visible
 * in the phone Files app (not only via USB under Android/data).
 */
export const exportDatabase = async (
  options: ExportOptions = {},
): Promise<{success: boolean; path?: string; error?: string}> => {
  const {silent = false} = options;
  const dbPath = `${RNFS.DocumentDirectoryPath}/../databases/pos.db`;
  const fileName = buildExportFileName();

  try {
    const exists = await RNFS.exists(dbPath);
    if (!exists) {
      const error = `DB not found at:\n${dbPath}`;
      if (!silent) {
        Alert.alert('Export failed', error);
      }
      console.error('Export failed:', error);
      return {success: false, error};
    }

    let destPath: string;

    if (Platform.OS === 'android' && DatabaseExport?.exportToDownloads) {
      destPath = await DatabaseExport.exportToDownloads(dbPath, fileName);
    } else {
      // iOS / fallback — app Documents folder
      const destDir = RNFS.DocumentDirectoryPath;
      destPath = `${destDir}/${fileName}`;
      if (await RNFS.exists(destPath)) {
        await RNFS.unlink(destPath);
      }
      await RNFS.copyFile(dbPath, destPath);
    }

    console.log('Database exported to:', destPath);
    if (!silent) {
      Alert.alert(
        'DB exported',
        Platform.OS === 'android'
          ? `Saved to Downloads:\n${fileName}\n\nOpen Files → Downloads`
          : destPath,
      );
    }
    return {success: true, path: destPath};
  } catch (error: any) {
    const message = String(error?.message ?? error);
    console.error('Error exporting DB:', error);
    if (!silent) {
      Alert.alert('Export failed', message);
    }
    return {success: false, error: message};
  }
};
