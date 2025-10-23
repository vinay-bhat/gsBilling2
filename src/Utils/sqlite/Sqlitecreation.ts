import { openDatabase } from "react-native-sqlite-storage";
import { tableArray } from "./SqlliteTable";

export let db: any = openDatabase({ name: "pos.db" });
export const creationSqlliteTable = () => {
    tableArray.map((item: any) => {
        db.transaction(function (txn: any) {
            txn.executeSql(
              `SELECT name FROM sqlite_master WHERE type='table' AND name='${item.tableName}'`,
              [],
              function (tx: any, res: any) {
                if (res.rows.length == 0) {
                  txn.executeSql(`DROP TABLE IF EXISTS ${item.tableName}`, []);
                  txn.executeSql(
                    item.tableCreateSchema,
                    [],
                    function(tx: any) {
                        console.log(`Table ${item.tableName} created successfully.`);
                    },
                    function(tx: any, error: any) {
                        console.error(`Error creating table ${item.tableName}:`, error);
                    }
                );
                }
              }
            );
          });
    });

};
