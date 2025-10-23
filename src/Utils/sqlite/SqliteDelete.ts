import { db } from "./Sqlitecreation";

export const truncateData = (tableName: string) => {
  return new Promise<void>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `DELETE FROM ${tableName}`,
        [],
        (_, results: any) => {
          console.log(
            `${tableName} truncated. Rows affected:`,
            results.rowsAffected
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
              console.error("Error resetting auto-increment:", error);
              reject(error);
            }
          );
        },
        (_, error: any) => {
          console.error("Error truncating table:", error);
          reject(error);
        }
      );
    });
  });
};
