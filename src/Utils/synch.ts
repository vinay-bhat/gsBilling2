import {
  getActiveData,
  getAllById,
  getAsyncedData,
  getLastValues,
} from '../Utils/sqlite/SqliteFetch';
import {Alert} from 'react-native';
import {sendPostRequest} from './ApiMethods';
import {batchUpdateStatusById, updateStatusById} from './sqlite/SqliteInsert';

export const syncCounterBill = async (
  mainTable: any,
  itemTable: any,
  paymentTable: any,
) => {
  let totalBills: any = [];
  try {
    await getAsyncedData(mainTable)
      .then(async result => {
        await Promise.all(
          result.map(async bill => {
            bill.counter_items = await getCounterItems(
              bill.bill_id,
              itemTable,
              'bill_id',
            );

            if (mainTable === 'counter_bills') {
              bill.counter_payments = await getCounterItems(
                bill.bill_id,
                paymentTable,
                'bill_id',
              );
            } else if (mainTable === 'sante_bills') {
              bill.discount = await getCounterItems(
                bill.bill_id,
                paymentTable,
                'bill_id',
              );
              console.log(`${mainTable} discount`, bill.discount);
            }
            totalBills.push(bill);
          }),
        );

        // console.log(`${mainTable} Data`, JSON.stringify(totalBills, null, 2));
      })
      .catch(error => {
        console.error('Error fetching counter bills data:', error);
      });
  } catch (e) {
    console.error('Error e:', e);
  }

  return totalBills;
};

const getCounterItems = async (id: any, tableName: any, column: any) => {
  let items: any = [];
  try {
    await getAllById(tableName, column, id)
      .then(result => {
        // for (let i = 0; i < result.length; i++) {
        //   response.push(result[i]);
        // }
        items = result;
      })
      .catch(error => {
        console.error('Error fetching counter items data:', error);
      });
  } catch (e) {
    console.error('Error e:', e);
  }
  return items;
};

export const onSync = async (
  noInternet: boolean,
  setSyncErr: (value: boolean) => void,
  setIsLoading: (value: boolean) => void,
  user: any,
  setSyncDone: (value: boolean) => void,
  onSyncComplete?: (success: boolean, results?: any) => void,
) => {
  console.log('noInternet', noInternet);
  const syncResults = {
    counterBillsProcessed: 0,
    santeBillsProcessed: 0,
    errors: [] as string[],
    success: true,
  };
  try {
    if (!noInternet) {
      setSyncErr(true);
      syncResults.success = false;
      syncResults.errors.push('No internet connection');
      return;
    }

    setSyncErr(false);
    setIsLoading(true);
    const counterBills = await syncCounterBill(
      'counter_bills',
      'counter_items',
      'counter_payments',
    );
    const santeBills = await syncCounterBill(
      'sante_bills',
      'sante_items',
      'sante_discounts',
    );

    if (
      (!counterBills || counterBills.length === 0) &&
      (!santeBills || santeBills.length === 0)
    ) {
      // Nothing pending — treat as successful sync
      return;
    }

    if (counterBills && counterBills.length > 0) {
      const data = {
        Order: [...counterBills],
      };
      try {
        console.log('COUNTER SYNC', JSON.stringify(data));
        const response = await sendPostRequest(
          user.sales_urls[0].Counter_data_synch,
          data,
        );
        console.log('Counter bill sync res', response);
        if (response?.status === 'success' && response?.bill_id != null) {
          // Compare as numbers — SQLite may return bill_id as string
          const responseBillId = Number(response.bill_id);
          const matchIndex = counterBills.findIndex(
            (bill: any) => Number(bill.bill_id) === responseBillId,
          );
          if (matchIndex !== -1) {
            const billIdsToUpdate = counterBills
              .slice(0, matchIndex + 1)
              .map((bill: any) => bill.bill_id);
            const updateResult = await batchUpdateStatusById(
              'counter_bills',
              billIdsToUpdate,
              'Done',
            );
            if (updateResult.success) {
              syncResults.counterBillsProcessed = billIdsToUpdate.length;
              console.log(
                `Successfully updated ${billIdsToUpdate.length} bills`,
              );
            } else {
              console.error('Batch update failed:', updateResult.error);
              syncResults.success = false;
              syncResults.errors.push('Failed to update local bill status');
              throw new Error('Failed to update local bill status');
            }
          } else {
            console.warn(
              'Bill ID not found in counterBills array:',
              response.bill_id,
              'local ids:',
              counterBills.map((b: any) => b.bill_id),
            );
            syncResults.success = false;
            syncResults.errors.push(
              `Bill ID ${response.bill_id} not found in pending bills`,
            );
            throw new Error(
              `Bill ID ${response.bill_id} not found in pending bills`,
            );
          }
        } else {
          syncResults.success = false;
          syncResults.errors.push('Counter bill sync failed');
          throw new Error('Counter bill sync failed');
        }
      } catch (err) {
        syncResults.success = false;
        if (!syncResults.errors.length) {
          syncResults.errors.push('Counter bill sync error');
        }
        throw err;
      }
    }
    console.log(santeBills, 'santeBills');

    if (santeBills && santeBills.length > 0) {
      const data = {
        Order: santeBills,
      };

      try {
        console.log(`Sante bill Data`, JSON.stringify(data));
        const response = await sendPostRequest(
          user.sales_urls[0].santhe_data_synch,
          data,
        );
        console.log('Sante bill sync', response);
        if (response) {
          await Promise.all(
            santeBills.map((bill: any) =>
              updateStatusById('sante_bills', bill.bill_id, 'Done'),
            ),
          );
          syncResults.santeBillsProcessed = santeBills.length;
        } else {
          syncResults.success = false;
          syncResults.errors.push('Sante bill sync failed');
          throw new Error('Sante bill sync failed');
        }
      } catch (err) {
        syncResults.success = false;
        if (!syncResults.errors.length) {
          syncResults.errors.push('Sante bill sync error');
        }
        throw err;
      }
    }
  } catch (error) {
    syncResults.success = false;
    console.log('Sync error', error);
  } finally {
    setIsLoading(false);
    // Only mark sync done when local pending bills were updated.
    // Do NOT set syncErr here — that modal is only for no-internet.
    setSyncDone(syncResults.success);
    onSyncComplete?.(syncResults.success, syncResults);
  }
};
