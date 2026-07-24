import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeModules} from 'react-native';
import {PRINTER_TYPE_KEY} from './AsyncStorageFunctions';
import {nyxPrinterDetails} from './nyxPrinterUtils';

const {
  NGXBillingModule,
  TVSBillingModule,
  UrovoBillingModule,
  IminiBillingModule,
} = NativeModules;

let resolvedPrinterModule = null;
let loadPromise = null;

function printerModuleForType(name) {
  switch (name) {
    case 'Imini':
      return IminiBillingModule;
    case 'NYX':
      return nyxPrinterDetails;
    case 'NGX':
      return NGXBillingModule;
    case 'TVS':
      return TVSBillingModule;
    case 'Urovo':
      return UrovoBillingModule;
    default:
      return nyxPrinterDetails;
  }
}

export function setPrinterModuleFromType(name) {
  resolvedPrinterModule = printerModuleForType(name);
  return resolvedPrinterModule;
}

export function getPrinterModule() {
  return resolvedPrinterModule ?? nyxPrinterDetails;
}

export async function ensurePrinterModuleLoaded() {
  if (resolvedPrinterModule) {
    return resolvedPrinterModule;
  }
  if (loadPromise) {
    return loadPromise;
  }
  loadPromise = (async () => {
    const name = await AsyncStorage.getItem(PRINTER_TYPE_KEY);
    resolvedPrinterModule = printerModuleForType(name);
    loadPromise = null;
    return resolvedPrinterModule;
  })();
  return loadPromise;
}
