import { sendGetRequest, sendPostRequest } from "../Utils/ApiMethods";
import {
  getActiveData,
  getTotalItemCount,
  isItemPresent,
} from "../Utils/sqlite/SqliteFetch";
import { inserData } from "../Utils/sqlite/SqliteInsert";

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
          // Perform action for case1
          // saveAppSettings(response.Details)
          if (isInternet) {
            if (response.Details && response.Details.length > 0) {
              const settings = [];
              // const totalItemCount = await getTotalItemCount(key);

              // if (response.Details.length > totalItemCount) {
              await Promise.all(
                response.Details.map(async (element) => {
                  try {
                    const isPresent = await isItemPresent(
                      "application_settings",
                      "app_setting_id",
                      element.app_setting_id
                    );
                    if (!isPresent) {
                      inserData("application_settings", element);
                      settings.push({
                        branch: branch,
                        app_setting_id: element.app_setting_id,
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
                `Get_application_setting/${branch}`,
                "callback_application_setting"
              );

              if (callBack !== "" && settings.length > 0) {
                // const res = await sendPostRequest(callBack, settings)
                console.log("application_settings CallBack", settings, url);
              }
              segregateAppSettings(
                response.Details,
                setDiscountType,
                saveAppSettings,
                setPaymentList,
                setSanteDiscountRatio
              );
            } else {
              response = await getDataFromDb(key);

              segregateAppSettings(
                response,
                setDiscountType,
                saveAppSettings,
                setPaymentList,
                setSanteDiscountRatio
              );
            }
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
          console.log(response.data, "inside outlet");
          if (isInternet) {
            if (response.data && response.data.length > 0) {
              const outlets = [];
              await Promise.all(
                response.data.map(async (element) => {
                  console.log(element, "outletsssss");
                  try {
                    const isPresent = await isItemPresent(
                      "outlet_details",
                      "outId",
                      element.outId
                    );
                    // outlets.push({ branch: branch, outId: element.outId });

                    if (!isPresent) {
                      inserData("outlet_details", element);
                      outlets.push({ branch: branch, outId: element.outId });
                    } else {
                      // console.error('present');
                    }
                  } catch (e) {
                    console.error("Error:", e.message);
                  }
                })
              );

              if (outlets.length > 0) {
                const callBack = url.replace(
                  `Get_outlet_deatils/${branch}`,
                  "callback_outlet_deatils"
                );
                // const res = await sendPostRequest(callBack, outlets)
                // console.log('outlet_details callback:', callBack, outlets, res);
              }
              setOutletDetails(response.data[0]);
            }
          }

          break;

        case "product_catgory":
          if (isInternet) {
            if (response.data && response.data.length > 0) {
              const categories = [];
              // await truncateData("product_category")
              // response.data.forEach(element => {
              //   inserData("product_category", element)
              //   categories.push({ pr_cat_id: element.pr_cat_id, branch: element.branch })

              // });
              await Promise.all(
                response.data.map(async (element) => {
                  try {
                    const isPresent = await isItemPresent(
                      "product_category",
                      "pr_cat_id",
                      element.pr_cat_id
                    );
                    if (!isPresent) {
                      inserData("product_category", element);
                      categories.push({
                        branch: branch,
                        pr_cat_id: element.pr_cat_id,
                      });
                    } else {
                      // console.error('present');
                    }
                  } catch (e) {
                    console.error("Error:", e.message);
                  }
                })
              );

              if (categories.length > 0) {
                const callBack = url.replace(
                  `Get_product_category/${branch}`,
                  "callback_product_category"
                );

                // const res = await sendPostRequest(callBack, categories)
                // console.log("product_category CallBack", res, categories);
              }

              saveCategories(await getDataFromDb(key));
            } else {
              response = await getDataFromDb(key);
              saveCategories(response);
            }
          } else {
            saveCategories(response);
          }

          break;

        case "products":
          if (isInternet) {
            if (response.data && response.data.length > 0) {
              // await truncateData("products")
              const produts = [];
              // const totalItemCount = await getTotalItemCount(key);
              // console.error('products present 1', totalItemCount);
              // if (response.data.length > totalItemCount) {
              // console.log("API CALL",response.data);
              await Promise.all(
                response.data.map(async (element) => {
                  try {
                    const isPresent = await isItemPresent(
                      "products",
                      "pr_id",
                      element.pr_id
                    );

                    if (!isPresent) {
                      inserData("products", element);
                      produts.push({ branch: branch, pr_id: element.pr_id });
                    } else {
                      // console.error('present');
                    }
                  } catch (e) {
                    console.error("Error:", e.message);
                  }
                })
              );

              callBack = url
                .replace("Get_product", "callback_product")
                .replace("/TM5", "");

              if (callBack !== "" && produts.length > 0) {
                console.log("feedback", produts, callBack);
                // const res = await sendPostRequest(callBack, produts)
              }

              saveProducts(await getDataFromDb(key));
              // console.log("feedback", res, callBack);
            } else {
              response = await getDataFromDb(key);
              console.error("Producrs present", response.length);
              saveProducts(response);
            }
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
