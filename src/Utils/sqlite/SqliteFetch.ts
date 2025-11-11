import {db} from './Sqlitecreation';
export const getActiveData = async (
  tableName: string,
  status: string = 'Active',
): Promise<any[]> => {
  return new Promise<any[]>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT * FROM ${tableName}`,
        [],
        (tx, results: any) => {
          const data: any[] = [];

          for (let i = 0; i < results.rows.length; i++) {
            data.push(results.rows.item(i));
          }

          resolve(data);
        },
        (error: any) => {
          reject(error);
        },
      );
    });
  });
};

export const isItemPresent = async (
  tableName: string,
  conditionColumn: string,
  conditionValue: string,
): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT * FROM ${tableName} WHERE ${conditionColumn} = ?`,
        [conditionValue],
        (tx, results: any) => {
          const isPresent: boolean = results.rows.length > 0;
          resolve(isPresent);
        },
        (error: any) => {
          reject(error);
        },
      );
    });
  });
};

export const getTotalItemCount = async (tableName: string): Promise<number> => {
  return new Promise<number>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT COUNT(*) AS totalItems FROM ${tableName}`,
        [],
        (tx, results: any) => {
          const totalItems: number = results.rows.item(0).totalItems;
          resolve(totalItems);
        },
        (error: any) => {
          reject(error);
        },
      );
    });
  });
};

export const getAllById = async (
  tableName: string,
  conditionColumn: string,
  conditionValue: string,
): Promise<any[]> => {
  return new Promise<any[]>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT * FROM ${tableName} WHERE ${conditionColumn} = ?`,
        [conditionValue],
        (tx, results: any) => {
          const data: any[] = [];

          for (let i = 0; i < results.rows.length; i++) {
            data.push(results.rows.item(i));
          }

          resolve(data);
        },
        (error: any) => {
          reject(error);
        },
      );
    });
  });
};

export const getAsyncedData = async (
  tableName: string,
  syncStatus: string = 'pending',
): Promise<any[]> => {
  return new Promise<any[]>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT * FROM ${tableName} WHERE sync_status = ?`,
        [syncStatus],
        (tx, results: any) => {
          const data: any[] = [];

          for (let i = 0; i < results.rows.length; i++) {
            data.push(results.rows.item(i));
          }

          resolve(data);
        },
        (error: any) => {
          reject(error);
        },
      );
    });
  });
};

export const getLastValues = async (
  tableName: string,
  columns: string[],
): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    const selectQuery = `SELECT ${columns.join(
      ',',
    )} FROM ${tableName} ORDER BY ROWID DESC LIMIT 1`;

    db.transaction((tx: any) => {
      tx.executeSql(
        selectQuery,
        [],
        (tx, results: any) => {
          console.log('getLastValues results', results.rows.item);
          if (results.rows.length > 0) {
            resolve(results.rows.item(0));
          } else {
            resolve(0); // If no rows found, return null
          }
        },
        (error: any) => {
          reject(error);
        },
      );
    });
  });
};

// export const getLastValues = async (tableName: string, columns: string[]): Promise<any> => {
//   return new Promise<any>((resolve, reject) => {

//     const selectQuery = `SELECT ${columns.join(',')} FROM ${tableName} ORDER BY ROWID DESC LIMIT 1`;
//     type ItemType = { [key: string]: any };
//     db.transaction((tx: any) => {
//       tx.executeSql(
//         selectQuery,
//         [],
//         (tx, results: any) => {
//           if (results.rows.length > 0) {
//             const item = results.rows.item(0);
//             // Transform null values to 0
//             const transformedItem = Object.keys(item).reduce<ItemType>((acc, key) => {
//               acc[key] = item[key] === null ? 0 :item[key] === undefined?0: item[key];
//               return acc;
//             }, {});
//             resolve(transformedItem);
//           } else {
//             resolve(0); // If no rows found, still return 0
//           }
//         },
//         (error: any) => {
//           reject(error);
//         }
//       );
//     });
//   });
// };
