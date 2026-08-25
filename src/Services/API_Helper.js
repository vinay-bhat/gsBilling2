import { sendGetRequest, sendPostRequest } from "../Utils/ApiMethods";
import {
  getActiveData,
  getTotalItemCount,
  isItemPresent,
} from "../Utils/sqlite/SqliteFetch";
import { inserData, updateData } from "../Utils/sqlite/SqliteInsert";

/**
 * Backend marks records synced via callback, so GET APIs only return
 * new/updated rows (or all rows on a fresh device). Empty [] means
 * nothing to write locally and callback must NOT be called.
 */
const sendSyncCallback = async (callBackUrl, ids) => {
  if (!callBackUrl || !ids || ids.length === 0) {
    return;
  }
  try {
    const payload = { data: ids };
    const res = await sendPostRequest(callBackUrl, payload);
    console.log("Sync callback success", callBackUrl, payload, res);
  } catch (e) {
    console.error("Sync callback error", callBackUrl, e?.message || e);
  }
};

const hasApiValues = (list) => Array.isArray(list) && list.length > 0;

const upsertAndCollectIds = async ({ items, tableName, idKey }) => {
  if (!hasApiValues(items)) {
    return [];
  }
  const syncedIds = [];
  await Promise.all(
    items.map(async (element) => {
      try {
        const id = element[idKey];
        if (id === undefined || id === null || id === "") {
          return;
        }
        const isPresent = await isItemPresent(tableName, idKey, id);
        if (!isPresent) {
          await inserData(tableName, element);
        } else {
          await updateData(tableName, element);
        }
        syncedIds.push(id);
      } catch (e) {
        console.error(`Error upserting ${tableName}:`, e?.message || e);
      }
    })
  );
  return syncedIds;
};

export const getInitialData = async (
  key,
  url,
  saveCategories,
  saveProducts,
  saveAppSettings,
  saveMastersCreationData,
  setDiscountList,
  setDiscountType,
  isInternet,
  branch,
  setPaymentList,
  setSanteData,
  setSanteDiscountRatio,
  setOutletDetails
) => {
  return new Promise(async (resolve, reject) => {
    let response = null;
    let callBack = "";

    let discountType = "";

    if (isInternet) {
      try {
        if (!url.includes("callback") && !url.includes("app_data_synching")) {
          response = await sendGetRequest(url);
        } else {
          resolve();
        }
      } catch (e) {
        console.log("get error", url, e);
      }
    } else {
      console.log("getDataFromDb", key);
      response = await getDataFromDb(key);
    }

    // console.log(response, url, "responseresponse");

    if (response !== null) {
      switch (key) {
        case "application_settings":
          if (isInternet) {
            // API returns only new/updated settings; [] = use local DB only
            if (hasApiValues(response.Details)) {
              const settings = await upsertAndCollectIds({
                items: response.Details,
                tableName: "application_settings",
                idKey: "app_setting_id",
              });

              callBack = url.replace(
                `Get_application_setting/${branch}`,
                `callback_application_setting/${branch}`
              );
              // Callback only for successfully added/updated ids
              await sendSyncCallback(callBack, settings);
            }

            segregateAppSettings(
              await getDataFromDb(key),
              setDiscountType,
              saveAppSettings,
              setPaymentList,
              setSanteDiscountRatio
            );
          } else {
            segregateAppSettings(
              response,
              setDiscountType,
              saveAppSettings,
              setPaymentList,
              setSanteDiscountRatio
            );
          }

          break;
        case "masters_creation":
          if (isInternet) {
            if (response.data && response.data.length > 0) {
              // await truncateData("masters_creation")
              // const totalItemCount = await getTotalItemCount("masters_creation");
              // console.error('masters_creation present 1', totalItemCount);
              // if (response.data.length > totalItemCount) {
              const masters = [];
              // await truncateData("product_category")

              // if (response.data.length > totalItemCount) {
              await Promise.all(
                response.data.map(async (element) => {
                  try {
                    const isPresent = await isItemPresent(
                      "masters_creation",
                      "masterId",
                      element.masterId
                    );
                    if (!isPresent) {
                      inserData("masters_creation", element);
                      masters.push({
                        branch: branch,
                        masterId: element.masterId,
                      });
                    } else {
                      // console.error('present');
                    }
                  } catch (e) {
                    console.error("Error:", e.message);
                  }
                })
              );

              const callBack = url.replace(
                `Get_masters_creation/${branch}`,
                "callback_masters_creation"
              );

              if (callBack !== "" && masters.length > 0) {
                // const res = await sendPostRequest(callBack, masters)
                // console.log("masters_creation CallBack", masters, callBack);
              }

              saveMastersCreationData(await getDataFromDb(key));
              // }
              // }
            } else {
              response = await getDataFromDb(key);
              saveMastersCreationData(response);
            }
          } else {
            saveMastersCreationData(response);
          }
          //
          break;
        case "credit_customers":
          if (isInternet) {
            if (response.data && response.data.length > 0) {
              const customers = [];
              await Promise.all(
                response.data.map(async (element) => {
                  try {
                    const isPresent = await isItemPresent(
                      "credit_customers",
                      "cust_id",
                      element.cust_id
                    );
                    // customers.push({ branch: branch, cust_id: element.cust_id });
                    if (!isPresent) {
                      inserData("credit_customers", element);
                      customers.push({
                        branch: branch,
                        cust_id: element.cust_id,
                      });
                    } else {
                      // console.error('present');
                    }
                  } catch (e) {
                    console.error("Error:", e.message);
                  }
                })
              );

              if (customers.length > 0) {
                const callBack = url.replace(
                  `Get_credit_customer/${branch}`,
                  "callback_credit_customer"
                );
                // const res = await sendPostRequest(callBack, customers)

                // console.log("credit_customer CallBack", customers, callBack, res);
              }
            }
          }

          break;
        case "outlet_details":
          if (isInternet) {
            // API returns only new/updated outlets; [] = keep local only
            if (hasApiValues(response.data)) {
              const outlets = await upsertAndCollectIds({
                items: response.data,
                tableName: "outlet_details",
                idKey: "outId",
              });

              callBack = url.replace(
                `Get_outlet_deatils/${branch}`,
                `callback_outlet_deatils/${branch}`
              );
              await sendSyncCallback(callBack, outlets);
            }

            const localOutlets = await getDataFromDb(key);
            if (localOutlets.length > 0) {
              setOutletDetails(localOutlets[0]);
            }
          } else if (response?.length > 0) {
            setOutletDetails(response[0]);
          }

          break;

        case "product_catgory":
          if (isInternet) {
            // API returns only new/updated categories; [] = keep local only
            if (hasApiValues(response.data)) {
              const categories = await upsertAndCollectIds({
                items: response.data,
                tableName: "product_category",
                idKey: "pr_cat_id",
              });

              callBack = url.replace(
                `Get_product_category/${branch}`,
                `callback_product_category/${branch}`
              );
              await sendSyncCallback(callBack, categories);
            }

            saveCategories(await getDataFromDb(key));
          } else {
            saveCategories(response);
          }

          break;

        case "products":
          if (isInternet) {
            // API returns only new/updated products; [] = keep local only
            if (hasApiValues(response.data)) {
              const products = await upsertAndCollectIds({
                items: response.data,
                tableName: "products",
                idKey: "pr_id",
              });

              callBack = url.replace(
                `Get_product/${branch}`,
                `callback_product/${branch}`
              );

              await sendSyncCallback(callBack, products);
            }

            saveProducts(await getDataFromDb(key));
          } else {
            saveProducts(response);
          }

          break;
        case "users":
          if (isInternet) {
            if (response.data && response.data.length > 0) {
              const users = [];

              await Promise.all(
                response.data.map(async (element) => {
                  try {
                    const isPresent = await isItemPresent(
                      "users",
                      "userId",
                      element.userId
                    );
                    users.push({ branch: branch, userId: element.userId });

                    if (!isPresent) {
                      inserData("users", element);
                      users.push({ branch: branch, userId: element.userId });
                    } else {
                      // console.error('present');
                    }
                  } catch (e) {
                    console.error("Error:", e.message);
                  }
                })
              );

              if (callBack !== "" && users.length > 0) {
                const callBack = url.replace(
                  `Get_users/${branch}`,
                  "callback_users"
                );

                // const res = await sendPostRequest(callBack, users)
                // console.log("users CallBack", res, users, callBack);
              }
            }
          }

          break;
        case "Santhe_products":
          if (isInternet) {
            if (response.data && response.data.length > 0) {
              // await truncateData("products")
              const produts = [];

              await Promise.all(
                response.data.map(async (element) => {
                  try {
                    const isPresent = await isItemPresent(
                      "Santhe_products",
                      "pr_id",
                      element.pr_id
                    );

                    if (!isPresent) {
                      inserData("Santhe_products", element);
                      produts.push({ branch: branch, pr_id: element.pr_id });
                    } else {
                      // console.error('present');
                    }
                  } catch (e) {
                    console.error("Error:", e.message);
                  }
                })
              );

              callBack = url.replace(
                `Get_product_santhe/${branch}`,
                `callback_product_santhe/${branch}`
              );

              if (callBack !== "" && produts.length > 0) {
                console.log("feedback", produts, callBack);
                // const res = await sendPostRequest(callBack, produts)
              }

              setSanteData(await getDataFromDb(key));
              // console.log("feedback", res, callBack);
            } else {
              response = await getDataFromDb(key);
              console.error("Producrs present", response.length);
              setSanteData(response);
            }
          } else {
            setSanteData(response);
          }

          break;
        default:
        // Perform a default action if the key doesn't match any case
      }
      console.error("RESOLVED");
      resolve();
    } else {
      resolve();
    }
  });
};

const getDataFromDb = async (key) => {
  let table = "";
  let response = [];
  switch (key) {
    case "product_catgory":
      // Perform action for case1
      table = "product_category";
      break;
    case "products":
      table = "products";
      break;
    case "application_settings":
      table = "application_settings";
      break;
    case "outlet_details":
      table = "outlet_details";
      break;
    case "masters_creation":
      table = "masters_creation";
      break;
    case "Santhe_products":
      table = "Santhe_products";
      break;
    default:
      table = "";
  }

  if (table != "") {
    try {
      await getActiveData(table)
        .then((result) => {
          // for (let i = 0; i < result.length; i++) {
          //   response.push(result[i]);
          // }
          if (result && result.length > 0) {
            response = result;
          }

          // response =result
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    } catch (e) {
      console.error("Error e:", e);
    }
  }
  console.log("getActiveData", table, response.length);
  return response;
};

const segregateAppSettings = (
  response,
  setDiscountType,
  saveAppSettings,
  setPaymentList,
  setSanteDiscountRatio
) => {
  let paymentModes = [];
  let discountTypes = [];
  // response.filter((it) => it.setting_type === "Discount")
  response.forEach((it) => {
    console.log(it, "it0100101");

    if (it.setting_type === "Discount") {
      discountTypes.push(it);
    } else if (it.setting_type === "Payment" && it.setting_access == "1") {
      paymentModes.push(it);
    } else if (it.setting_name == "BILLING_OFFERS") {
      setSanteDiscountRatio(it.setting_title);
    }
  });

  if (discountTypes != null && discountTypes.length > 0) {
    discountTypes.forEach((it) => {
      if (it.setting_access == "1") {
        switch (it.setting_name) {
          case "CATEGORY_WISE_DISCOUNT":
            setDiscountType("Cat_discount");
            break;
          case "FLAT_DISCOUNT":
            setDiscountType("Flat_discount");
            break;
          default:
            setDiscountType(it.setting_name);
        }
      }
    });
  }
  console.log("saveAppSettings", response);
  saveAppSettings(response);
  setPaymentList(paymentModes);
};
