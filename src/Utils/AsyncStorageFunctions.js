import AsyncStorage from '@react-native-async-storage/async-storage';

export const PRINTER_TYPE_KEY = '@printerType';

/* Session Storage */
export async function setSession(key, value) {
let data 
if(typeof value !== "string")
{
    data = JSON.stringify(value)
}else{
    data = value
}

  await AsyncStorage.setItem(`@${key}`, data);
}

export async function getSession(key) {
  const value = await AsyncStorage.getItem(`@${key}`);
  
  return value;
}

export async function removeSession(key) {
  await AsyncStorage.removeItem(`@${key}`);
}

async function removeAllSession() {
  await AsyncStorage.removeAllSession();
}

const SessionStorage = {
  set: setSession,
  get: getSession,
  remove: removeSession,
  clearAll: removeAllSession,
};

export { SessionStorage };
