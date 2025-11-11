import {db} from './Sqlitecreation';

export const truncateData = (tableName: string) => {
  return new Promise<void>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `DELETE FROM ${tableName}`,
        [],
        (_, results: any) => {
          console.log(
            `${tableName} truncated. Rows affected:`,
            results.rowsAffected,
          );
          // resolve();
          tx.executeSql(
            `DELETE FROM sqlite_sequence WHERE name = ?`,
            [tableName],
            (_, resetResults: any) => {
              console.log(`${tableName} auto-increment reset.`);
              resolve();
            },
            (_, error: any) => {
              console.error('Error resetting auto-increment:', error);
              reject(error);
            },
          );
        },
        (_, error: any) => {
          console.error('Error truncating table:', error);
          reject(error);
        },
      );
    });
  });
};

export const deleteYesterdayDoneCounterBills = () => {
  return new Promise<void>((resolve, reject) => {
    // Calculate today's date in ISO format (yyyy-mm-dd)
    const currentDate = new Date();
    const todayDate = currentDate.toISOString().split('T')[0];

    console.log(todayDate, 'todayDate');

    console.log(
      `Deleting counter_bills records for all dates except today (${todayDate}) with status "Done"`,
    );

    db.transaction((tx: any) => {
      tx.executeSql(
        `DELETE FROM counter_bills WHERE invoice_date != ? AND status = ?`,
        [todayDate, 'Done'],
        (_tx: any, results: any) => {
          console.log(
            `Deleted ${results.rowsAffected} counter_bills records (all dates except today) with status "Done"`,
          );
          resolve();
        },
        (_tx: any, error: any) => {
          console.error('Error deleting counter_bills records:', error);
          reject(error);
        },
      );
    });
  });
};
