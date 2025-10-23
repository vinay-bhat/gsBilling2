import { sendGetRequest, sendPostRequest } from "../Utils/ApiMethods";
import { truncateData } from "../Utils/sqlite/SqliteDelete";
import { getActiveData, isItemPresent } from "../Utils/sqlite/SqliteFetch";
import { inserData } from "../Utils/sqlite/SqliteInsert";

export const getInitialData = async (key, url, saveCategories, saveProducts, saveAppSettings, saveMastersCreationData, setDiscountList, setDiscountType, isInternet, branch, setPaymentList) => {
  return new Promise(async (resolve, reject) => {
    let response = null;
    let callBack = '';

    try {
      if (isInternet && !url.includes("callback")) {
        response = await sendGetRequest(url);
      } else {
        callBack = url;
      }
    } catch (e) {
      console.error("get error", url, e);
      reject(e);
      return;
    }

    if (!isInternet) {
      response = await getDataFromDb(key);
    }

    if (response !== null) {
      switch (key) {
        case 'application_settings':
          await handleApplicationSettings(response, branch, isInternet, setDiscountType, saveAppSettings, setPaymentList, callBack);
          break;
        case 'masters_creation':
          await handleMastersCreation(response, branch, isInternet, saveMastersCreationData, callBack);
          break;
        case 'product_catgory':
          await handleProductCategory(response, branch, isInternet, saveCategories, callBack);
          break;
        case 'products':
          await handleProducts(response, branch, isInternet, saveProducts, callBack);
          break;
        // Add similar cases for other keys
        default:
          // Perform a default action if the key doesn't match any case
      }
      resolve();
    } else {
      reject(new Error("No response received"));
    }
  });
};

const handleApplicationSettings = async (response, branch, isInternet, setDiscountType, saveAppSettings, setPaymentList, callBack) => {
  let paymentModes = [];
  let discountTypes = [];
  
  response.forEach((it) => {
    if (it.setting_type === "Discount") {
      discountTypes.push(it);
    } else if (it.setting_type === "Payment" && it.setting_access == "1") {
      paymentModes.push(it);
    }
  });

  if (discountTypes != null && discountTypes.length > 0) {
    discountTypes.forEach((it) => {
      if (it.setting_access == "1") {
        switch (it.setting_name) {
          case 'CATEGORY_WISE_DISCOUNT':
            setDiscountType('Cat_discount');
            break;
          case "FLAT_DISCOUNT":
            setDiscountType('Flat_discount');
            break;
          default:
            setDiscountType(it.setting_name);
        }
      }
    });
  }

  saveAppSettings(response);
  setPaymentList(paymentModes);

  // Process callback logic if required
  if (isInternet && callBack !== "" && paymentModes.length > 0) {
    const settings = paymentModes.map((element) => ({ branch: branch, app_setting_id: element.app_setting_id }));
    try {
      const res = await sendPostRequest(callBack, settings);
      console.log("CallBack", res, settings);
    } catch (e) {
      console.error('Callback error:', e.message);
    }
  }
};

const handleMastersCreation = async (response, branch, isInternet, saveMastersCreationData, callBack) => {
  const masters = [];

  response.forEach(async (element) => {
    try {
      const isPresent = await isItemPresent("masters_creation", "masterId", element.masterId);
      if (!isPresent) {
        inserData("masters_creation", element);
        masters.push({ branch: branch, masterId: element.masterId });
      } else {
        console.error('present');
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  });

  // Process callback logic if required
  if (isInternet && callBack !== "" && masters.length > 0) {
    try {
      const res = await sendPostRequest(callBack, masters);
      console.log("CallBack", res, masters);
    } catch (e) {
      console.error('Callback error:', e.message);
    }
  }

  saveMastersCreationData(response);
};

const handleProductCategory = async (response, branch, isInternet, saveCategories, callBack) => {
  const categories = [];

  response.forEach(async (element) => {
    try {
      const isPresent = await isItemPresent("product_category", "pr_cat_id", element.pr_cat_id);
      if (!isPresent) {
        inserData("product_category", element);
        categories.push({ branch: branch, pr_cat_id: element.pr_cat_id });
      } else {
        console.error('present');
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  });

  // Process callback logic if required
  if (isInternet && callBack !== "" && categories.length > 0) {
    try {
      const res = await sendPostRequest(callBack, categories);
      console.log("CallBack", res, categories);
    } catch (e) {
      console.error('Callback error:', e.message);
    }
  }

  saveCategories(response);
};

const handleProducts = async (response, branch, isInternet, saveProducts, callBack) => {
  const produts = [];

  response.forEach(async (element) => {
    try {
      const isPresent = await isItemPresent("products", "pr_id", element.pr_id);
      if (!isPresent) {
        inserData("products", element);
        produts.push({ branch: branch, pr_id: element.pr_id });
      } else {
        console.error('present');
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  });

  // Process callback logic if required
  if (isInternet && callBack !== "" && produts.length > 0) {
    try {
      const res = await sendPostRequest(callBack, produts);
      console.log("CallBack", res, produts);
    } catch (e) {
      console.error('Callback error:', e.message);
    }
  }

  saveProducts(response);
};

const getDataFromDb = async (key) => {
  let table = "";
  let response = [];

  switch (key) {
    case 'product_catgory':
      table = "product_category";
      break;
    case 'products':
      table = "products";
      break;
    case 'application_settings':
      table = 'application_settings';
      break;
    case 'masters_creation':
      table = 'masters_creation';
      break;
    default:
      table = "";
  }

  if (table != '') {
    try {
      await getActiveData(table)
        .then((result) => {
          for (let i = 0; i < result.length; i++) {
            response.push(result[i]);
          }
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
        });
    } catch (e) {
      console.error('Error e:', e);
    }
  }

  return response;
};
