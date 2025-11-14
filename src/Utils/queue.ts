import AsyncStorage from '@react-native-async-storage/async-storage';
//@ts-ignore
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({name: 'pos.db'});

interface BillPackage {
  billData: any;
  items: any[];
  payments: any[];
}

let queue: BillPackage[] = [];
let isProcessing = false;

export async function initDBQueue() {
  const stored = await AsyncStorage.getItem('DB_INSERT_QUEUE');
  if (stored) {
    try {
      queue = JSON.parse(stored);
      console.log('Restored', queue.length, 'pending DB writes');
    } catch (e) {}
  }
  processQueue();
}

async function persist() {
  await AsyncStorage.setItem('DB_INSERT_QUEUE', JSON.stringify(queue));
}

export async function queueDBInsert(pkg: BillPackage) {
  queue.push(pkg);
  await persist();
  processQueue();
}

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  const pkg = queue[0];

  try {
    await insertBillPackage(pkg);
    queue.shift();
    await persist();
  } catch (err) {
    console.log('DB Insert failed, retrying in 3 sec', err);
    setTimeout(() => {
      isProcessing = false;
      processQueue();
    }, 3000);
    return;
  }

  isProcessing = false;
  processQueue();
}

function insertBillPackage({billData, items, payments}: BillPackage) {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: any) => {
        insertOne(tx, 'counter_bills', billData);

        items?.forEach(item => insertOne(tx, 'counter_items', item));

        payments?.forEach(p => insertOne(tx, 'counter_payments', p));
      },
      (err: any) => reject(err),
      () => resolve(true),
    );
  });
}

function insertOne(tx: any, table: string, obj: any) {
  const keys = Object.keys(obj);
  const qMarks = keys.map(() => '?').join(',');
  const values = Object.values(obj);

  tx.executeSql(
    `INSERT INTO ${table}(${keys.join(',')}) VALUES (${qMarks})`,
    values,
  );
}
