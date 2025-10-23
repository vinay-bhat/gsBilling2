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
      onSyncComplete?.(false, syncResults);
      return;
    } else {
      setIsLoading(true);
      // const res = await sendGetRequest(COUNTER_API)

      // const urls = user.sales_urls[0]
      // if (res && res.length > 0) {

      //   // iterateUrls(res, urls)

      // }
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
        counterBills &&
        counterBills.length == 0 &&
        santeBills &&
        santeBills.length == 0
      ) {
        setIsLoading(false);
        return;
      }

      // if (counterBills && counterBills.length > 0) {
      //   for (let i = 0; i < counterBills.length; i++) {
      //     const data = {
      //       Order: [counterBills[i]],
      //     };
      //     try {
      //       console.log("COUNTER SYNC", JSON.stringify(data));
      //       // const response=null

      //       const response = await sendPostRequest(
      //         user.sales_urls[0].Counter_data_synch,
      //         data
      //       );
      //       console.log("Counter bill sync res", response);
      //       if (response) {
      //         counterBills.forEach((bill: any) => {
      //           updateStatusById("counter_bills", bill.bill_id, "Done");
      //         });
      //       }
      //     } catch (err) {
      //       console.log("Counter bill sync error", err);
      //     }
      //   }
      // }

      if (counterBills && counterBills.length > 0) {
        const data = {
          Order: [...counterBills],
        };
        try {
          console.log('COUNTER SYNC', JSON.stringify(data));
          // const response=null

          // const response = await sendPostRequest(
          //   user.sales_urls[0].Counter_data_synch,
          //   data
          // );
          const response = await sendPostRequest(
            user.sales_urls[0].counter_data_upload,
            data,
          );
          console.log('Counter bill sync res', response);
          if (response?.status === 'success' && response?.bill_id) {
            // Find the index of the matching bill_id
            const responseBillId = parseInt(response.bill_id, 10);
            const matchIndex = counterBills.findIndex((bill: any) => {
              console.log(bill.bill_id, response.bill_id);
              return bill.bill_id === responseBillId;
            });
            if (matchIndex !== -1) {
              // Get all bill IDs up to and including the match
              const billIdsToUpdate = counterBills
                .slice(0, matchIndex + 1)
                .map((bill: any) => bill.bill_id);
              // Batch update all at once
              const updateResult = await batchUpdateStatusById(
                'counter_bills',
                billIdsToUpdate,
                'Done',
              );
              if (updateResult.success) {
                console.log(
                  `Successfully updated ${updateResult.updated} bills`,
                );
              } else {
                console.error('Batch update failed:', updateResult.error);
              }
            } else {
              console.warn(
                'Bill ID not found in counterBills array:',
                response.bill_id,
              );
            }
          } else {
            syncResults.success = false;
            syncResults.errors.push('Counter bill sync failed');
            throw new Error('Counter bill sync failed');
          }
        } catch (err) {
          syncResults.success = false;
          syncResults.errors.push('Counter bill sync error');
          throw new Error('Counter bill sync error');
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
            santeBills.forEach((bill: any) => {
              updateStatusById('sante_bills', bill.bill_id, 'Done');
            });
          }
        } catch (err) {
          syncResults.success = false;
          syncResults.errors.push('Sante bill sync error');
          throw new Error('Sante bill sync error');
        }
      }
    }

    setIsLoading(false);
    setSyncDone(true);
  } catch (error) {
    // syncResults.success = false;
    // syncResults.errors.push('Sync error');
    // throw new Error('Sync error');
    console.log('Sync error', error);
  } finally {
    setIsLoading(false);
    setSyncDone(true);

    // Execute callback when sync is complete
    onSyncComplete?.(syncResults.success, syncResults);
  }
};
