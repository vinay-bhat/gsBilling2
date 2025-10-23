import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import React, {
  Component,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import Header from "../Components/Header";
import DiscountModal from "../Modals/Discounts";
import NCModal from "../Modals/NC";
import Icon from "react-native-vector-icons/FontAwesome";
import { dashboardStyles as styles } from "./DashboardStyle";
import NormalCart from "./Cart/NormalCart";
import SanteCart from "./Cart/SanteCart";
import useStore from "../Redux/Store";
import { sendGetRequest, sendPostRequest } from "../Utils/ApiMethods";
import Loader from "../Components/Loader";
import { useNavigation } from "@react-navigation/native";
import MultiPayment from "../Modals/MultiPayment";
import NoData from "../Components/NoData";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import CustomerInfo from "../Modals/CustomerInfo";
import {
  COUNTER_API,
  apiUrlMapping,
  applyDiscount,
  getCurrentDatTime,
  getCurrentFinancialYear,
  getDeviceType,
  isSettingEnabled,
  transformItem,
} from "../Utils/Common";
import SyncModal from "../Modals/SyncModal";
import NetInfo from "@react-native-community/netinfo";
import { getInitialData } from "../Services/API_Helper";
import { inserData, updateStatusById } from "../Utils/sqlite/SqliteInsert";
import {
  getActiveData,
  getAllById,
  getAsyncedData,
  getLastValues,
} from "../Utils/sqlite/SqliteFetch";
import { truncateData } from "../Utils/sqlite/SqliteDelete";
import NoDataModal from "../Modals/NoDataModal";
import { NativeModules, Button } from "react-native";
const { NXGBillingModule } = NativeModules;
const { TVSBillingModule } = NativeModules;
import {
  requestMultiple,
  PERMISSIONS,
  RESULTS,
  request,
} from "react-native-permissions";
import { getSession } from "../Utils/AsyncStorageFunctions";

const Dashboard = () => {
  const [cartList, setCartList] = useState([]);
  const [discountModal, setDiscountModal] = useState(false);
  const [ncModal, setNcModal] = useState(false);
  const [isSante, setIsSante] = useState(false);
  const [cat_id, setCatId] = useState("");
  const [products, setProducts] = useState([]);
  const [productsRef, setProductsRef] = useState([]);

  const [categories, setCategories] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isMultiPayment, setIsMultiPayment] = useState(false);
  const [custInfo, setCustInfo] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const [paymentType, setPaymentType] = useState({});
  const [noInternet, setNoInternet] = useState(false);
  const [syncErr, setSyncErr] = useState(false);
  const [discountedItems, setDiscountedItems] = useState([]);
  const [syncDone, setSyncDone] = useState(false);
  const [noSyncdata, setNoSyncData] = useState(false);

  const [groupedItems, setGroupedItems] = useState({});

  const navigation = useNavigation();
  // const[categories,saveCategories]= useStore([])
  const {
    user,
    saveUserData,
    productCategories,
    saveCategories,
    saveProducts,
    productList,
    selectedDiscount,
    paymentList,
    santeData,
    saveAppSettings,
    saveMastersCreationData,
    setDiscountList,
    setDiscountType,
    setPaymentList,
    setMultipayment,
    multiPayment,
    setSelectedDiscount,
    discountDetails,
    ncModalData,
    setNcModalData,
    setDiscountDetails,
    appSettings,
    setDicountedItemsId,
    discountedItemId,
    setSanteDiscountRatio,
    santeDiscountRatio,
    outletDetails,
    setOutletDetails,
    setTokenNumber,
    tokenNumber,
  } = useStore();

  useEffect(() => {
    async function requestBluetooth() {
      console.log(appSettings, "requesting");
      let androidPermissions = [
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      ];
      const OsVer = Platform.constants["Release"];

      if (OsVer > 12) {
        const statuses = await requestMultiple(androidPermissions);
        // return Object.values(statuses).some(el => el === RESULTS.GRANTED);
      }
    }

    requestBluetooth();
  }, []);

  useEffect(() => {
    const deviceType = getDeviceType();
    console.log("deviceType", deviceType);
    // Set numColumns based on screen width
    if (deviceType == "Mobile") {
      setNumColumns(2);
    } else {
      setNumColumns(4);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNoInternet(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAddToCart = (item) => {
    const updatedCartList = [...cartList];
    const index = updatedCartList.findIndex(
      (cartItem) => cartItem.pr_id === item.pr_id
    );

    if (index !== -1) {
      // updatedCartList[index].qty += 1;
      updatedCartList[index] = {
        ...updatedCartList[index],
        qty: updatedCartList[index].qty + 1,
      };
    } else {
      // item.qty = 1;
      // updatedCartList.push(item);
      const newItem = { ...item, qty: 1 };
      updatedCartList.push(newItem);
    }

    setCartList(updatedCartList);
  };

  const getItemTotal = () => {
    return cartList.reduce(
      (total, item) => total + parseInt(item.basic_rate),
      0
    );
  };

  const getItemQty = () => {
    return cartList.reduce((total, item) => total + item.qty, 0);
  };
  const getItemQtyWithCarryBag = useMemo(() => {
    const pattern = /^Carry Bag/;
    const updatedCartWithoutCarryBag = cartList.filter(
      (item) => !pattern.test(item.product_name)
    );

    return updatedCartWithoutCarryBag.reduce(
      (total, item) => total + item.qty,
      0
    );
  }, [cartList]);

  const [itemsForDiscount, discountPerSet] = santeDiscountRatio
    .split(":")
    .map(Number);

  // const getCartTotal = () => {
  //   const totalAmt = cartList.reduce((total, item) => total + item.qty * parseInt(item.basic_rate), 0);
  //   const disAmt = totalAmt - totalAmt * selectedDiscount / 100
  //   const finalWithTax = disAmt + disAmt * 18 / 100

  //   return Number(finalWithTax.toFixed(2))
  // };

  const getCartTotal = () => {
    const totalAmt = cartList.reduce((total, item) => {
      const itemTotal = item.qty * parseInt(item.basic_rate);
      // const itemDiscountedTotal = itemTotal - itemTotal * (selectedDiscount > 0? selectedDiscount/ 100 : parseInt(item.discount_perc)/100);
      const itemDiscountedTotal =
        itemTotal - (itemTotal * parseInt(item.discount_perc)) / 100;

      const taxPercentage = parseInt(item.basic_tax_percent); // Get the tax percentage from the item
      const taxAmount = (itemDiscountedTotal * taxPercentage) / 100; // Calculate tax amount based on tax percentage
      return total + itemDiscountedTotal + taxAmount; // Add tax amount to the total
    }, 0);

    return Number(totalAmt.toFixed(2));
  };

  const handleQty = (type, item, count) => {
    const updatedCartList = [...cartList];
    const index = updatedCartList.findIndex(
      (cartItem) => cartItem.pr_id === item.pr_id
    );

    if (index !== -1) {
      if (type === "delete") {
        updatedCartList[index].qty === 0;
        updatedCartList.splice(index, 1);
      } else if (type == "bulk" && count < 99) {
        if (count == null || count == undefined || count <= 0) {
          updatedCartList[index].qty = 1;
        } else {
          updatedCartList[index].qty = parseInt(count);
        }
      } else {
        if (type === "remove" && updatedCartList[index].qty > 1) {
          updatedCartList[index].qty = parseInt(updatedCartList[index].qty) - 1;
        } else if (type === "add") {
          updatedCartList[index].qty = parseInt(updatedCartList[index].qty) + 1;
        }

        if (updatedCartList[index].qty === 0) {
          updatedCartList.splice(index, 1);
        }
      }
    }

    setCartList(updatedCartList);
  };

  const openNcModal = () => {
    setNcModal(true);
  };
  const openMulti = () => {
    setIsMultiPayment(true);
  };

  useEffect(() => {
    if (productCategories && productCategories.length > 0) {
      setCategories(productCategories);
    }
    //  await truncateData("sante_bills")
    //  await truncateData("sante_items")

    //  await truncateData("sante_discounts")
  }, [productCategories]);

  useEffect(() => {
    // console.log("cat productList", productList);
    if (productList && productList.length > 0) {
      getProductByCat(productCategories[0]?.pr_cat_code);
      // getProductByCat(215);
    }
  }, [productList]);

  // console.log("dash paymentList", paymentList);

  const getProductByCat = (id) => {
    let value = 0;
    if (cat_id !== "") {
      value = cat_id;
    } else {
      value = id;
    }

    const res =
      productList && productList.filter((item) => item.pr_cat_id == id);
    // console.log("cat ID", id,res);
    setProducts(res);
    setProductsRef(res);
    setCatId(id);
    setIsLoading(false);
  };

  const onSearch = (value) => {
    if (value !== "") {
      const searchResults = productsRef.filter((item) =>
        item.product_name.toLowerCase().includes(value.toLowerCase())
      );
      setProducts(searchResults);
    } else {
      setProducts(productsRef);
    }
  };

  const enableSante = (isOn) => {
    if (isOn) {
      setIsSante(false);
      getProductByCat(productCategories[0]?.pr_cat_code);
      // getProductByCat(215);
      setCartList([]);
    } else {
      setIsSante(true);
      getProductByCat(productCategories[0]?.pr_cat_code);
      // getProductByCat(215)
      setProducts(santeData);
      setProductsRef(santeData);
      setCartList([]);
    }
  };

  const onPaymentSelect = (item) => {
    setPaymentType(item);
    switch (item.setting_name) {
      case "NC":
        openNcModal();
        setMultipayment({
          multi_paytm: "0.0",
          multi_card: " 0.0",
          multi_cash: " 0.0",
          multi_phonepay: " 0.0",
        });
        break;
      case "MULTI":
        openMulti();
        break;
      default:
        setMultipayment({
          multi_paytm: "0.0",
          multi_card: " 0.0",
          multi_cash: " 0.0",
          multi_phonepay: " 0.0",
        });
    }
  };

  const getCartTotal2 = () => {
    const finalAmt = cartList.reduce((total, item) => {
      const itemTotal = item.qty * parseFloat(item.basic_rate);
      // const itemDiscountedTotal = itemTotal - itemTotal * (selectedDiscount > 0? selectedDiscount/ 100 : parseInt(item.discount_perc)/100);
      const itemDiscountedTotal =
        itemTotal - (itemTotal * parseInt(item.discount_perc)) / 100;

      const taxPercentage = parseInt(item.basic_tax_percent); // Get the tax percentage from the item
      const taxAmount = (itemDiscountedTotal * taxPercentage) / 100; // Calculate tax amount based on tax percentage
      // console.log("itemDiscountedTotal", item.item_tax_amt);
      return total + itemDiscountedTotal + taxAmount; // Add tax amount to the total
    }, 0);
    const totalAmt = cartList.reduce(
      (total, item) => total + item.qty * parseInt(item.basic_rate),
      0
    );
    const disAmt = totalAmt - (totalAmt * selectedDiscount) / 100;
    const finalWithTax = disAmt + (disAmt * 18) / 100;
    const discount = totalAmt - disAmt;
    const totalBasic = cartList.reduce(
      (total, item) => total + item.qty * parseFloat(item.basic_rate),
      0
    );
    return {
      totalAmt: finalAmt,
      disAmt: disAmt,
      finalWithTax: finalWithTax,
      discount: discount,
      totalBasic: totalBasic,
    };
  };
  const getTotalTaxApplied = () => {
    const totalAmt = cartList.reduce((total, item) => {
      const itemTotal = item.qty * parseInt(item.basic_rate);
      const itemDiscountedTotal =
        itemTotal - (itemTotal * selectedDiscount) / 100;
      const taxPercentage = parseInt(item.basic_tax_percent); // Get the tax percentage from the item
      const taxAmount = (itemDiscountedTotal * taxPercentage) / 100; // Calculate tax amount based on tax percentage
      return total + taxAmount; // Add tax amount to the total
    }, 0);

    return Number(totalAmt.toFixed(2));
  };

  const newPrintGenerate = async () => {
    setIsLoading(true);
    const { totalAmt, disAmt, finalWithTax, discount } = getCartTotal2();
    const { date, time } = getCurrentDatTime();
    const pattern = /^Carry Bag/;
    let reqObj = {};
    let updatedCartWithoutcarryBag = cartList.filter(
      (item) => !pattern.test(item.product_name)
    );
    const { discountedCart, totalPrice, totalBasic, discountedItemsId } =
      applyDiscount(updatedCartWithoutcarryBag, santeDiscountRatio);

    setDicountedItemsId(discountedItemsId);

    let { bill_id } = await getLastValues("sante_bills", ["bill_id"]);

    if (bill_id === null || bill_id === undefined) {
      const response = await getSession("loginData");
      const data = JSON.parse(response);
      bill_id = parseInt(data?.santhe_bill_id);

      reqObj = {
        bill_id: bill_id + 1,
        bill_no: `${user.branch}-${bill_id + 1}`,
        bill_date: date,
        bill_time: time,
        total_basic: totalBasic,
        total_qty: getItemQty(),
        discount_amount: discount,
        taxable_amount: totalPrice,
        tax_amount: 0,
        cgst_price: 0,
        sgst_price: 0,
        grand_total_amount: Math.round(totalPrice),
        payment_type: paymentType.setting_name,
        branch_name: user.branch,
        sync_status: "pending",
      };
    } else {
      reqObj = {
        bill_no: `${user.branch}-${bill_id + 1}`,
        bill_date: date,
        bill_time: time,
        total_basic: totalBasic,
        total_qty: getItemQty(),
        discount_amount: discount,
        taxable_amount: totalPrice,
        tax_amount: 0,
        cgst_price: 0,
        sgst_price: 0,
        grand_total_amount: Math.round(totalPrice),
        payment_type: paymentType.setting_name,
        branch_name: user.branch,
        sync_status: "pending",
      };
    }

    console.log(reqObj, "reqObjreqObj");

    await inserData("sante_bills", reqObj);
    let sante_discounts = [];
    let sante_items = [];
    let itemId;
    let catId = 0;
    // console.log("discountedCart", discountedCart);
    if (discountedCart.length > 0 && bill_id != null) {
      console.log(discountedCart, "discountedCart123");

      for (const item of discountedCart) {
        const baseData = {
          item_id: item?.pr_id,
          item_name: item.product_name,
          item_qty: item.qty,
          item_price: parseInt(item.price) * item.qty,
          item_basic: item.basic_rate * item.qty,
          item_tax_percent: "0",
          basic_tax: "0",
          cat_id: item.pr_cat_id,
          item_discount: "0",
          item_taxable: item.price,
          item_discount_tax_amount: 0,
          bill_id: bill_id + 1,
          bill_date: date,
          branch_name: user.branch,
        };

        if (discountedItemsId.includes(item.pr_id)) {
          catId = item.pr_id;
        }
        await inserData("sante_items", baseData);
        sante_items.push(baseData);

        if (item.discounted) {
          if (catId == item.pr_id) {
            const obj = {
              item_id: item?.pr_id,
              item_qty: item.qty,
              item_name: item.product_name,
              item_price: item?.price,
              item_basic: item?.basic_rate,
              bill_id: bill_id + 1,
              id: item?.id,
              branch_name: user.branch,
            };
            console.log("catId 3", catId);
            sante_discounts.push(obj);
            await inserData("sante_discounts", obj);
          } else {
            let { item_id } = await getLastValues("sante_items", ["item_id"]);

            if (item_id == undefined) {
              item_id = 0;
            }

            const obj = {
              item_id: item?.pr_id,
              item_qty: item.qty,
              item_name: item.product_name,
              item_price: item?.price,
              item_basic: item?.basic_rate,
              bill_id: bill_id + 1,
              id: item?.id,
              branch_name: user.branch,
            };
            sante_discounts.push(obj);
            await inserData("sante_discounts", obj);
          }
        }
      }
    }
    reqObj.sante_items = sante_items;
    reqObj.sante_discounts = sante_discounts;

    console.log("sante_bills", reqObj);
    setIsLoading(false);
    setCustInfo(false);
    setCartList([]);
    setPaymentType({});
    setSelectedDiscount(0);
    setMultipayment({
      multi_paytm: "0.0",
      multi_card: " 0.0",
      multi_cash: " 0.0",
      multi_phonepay: " 0.0",
    });
    setDicountedItemsId([]);
    enableSante(false);

    var res = {};
    sante_discounts.map((e) => {
      if (!res[e.id]) res[e.id] = Object.assign({}, e); // clone
      else res[e.id].item_qty += e.item_qty;
    });
    let mergedDiscountArray = Object.values(res);
    let removedDiscountArray = cartList.map((cv) => {
      // console.log(cv, "removedisss");
      let quantity = cv.qty;
      mergedDiscountArray.find(function (e) {
        // console.log(e, "inside removee");
        if (e.id == cv.id) {
          console.log("inside iddd");
          quantity = cv.qty - e.item_qty;
        }
        console.log(quantity, "quantity");
      });
      return { ...cv, qty: quantity };
    });
    let group_to_values = removedDiscountArray.reduce(function (obj, item) {
      obj[item.cgst_tax] = obj[item.cgst_tax] || [];
      obj[item.cgst_tax].push(item.cgst_tax_amount * item.qty);
      return obj;
    }, {});
    let groups = Object.keys(group_to_values).map(function (key) {
      return {
        cgst: key,
        amount: group_to_values[key].reduce((a, b) => a + b, 0),
      };
    });

    NXGBillingModule.santhePrint(
      outletDetails?.branch_title,
      outletDetails?.org_name,
      outletDetails?.gstin_no,
      outletDetails?.address1,
      outletDetails?.address2,
      outletDetails?.cin_no,
      cartList,
      outletDetails?.branch,
      bill_id.toString(),
      `${user.branch}-${bill_id + 1}`,
      date,
      time,
      sumBasic(cartList),

      isNaN(sumBasicDiscount(sante_discounts))
        ? 0
        : sumBasicDiscount(sante_discounts),

      sante_discounts,

      isNaN(sumTotal(cartList) - sumTotalDiscount(sante_discounts))
        ? 0
        : sumTotal(cartList) - sumTotalDiscount(sante_discounts),

      sumBasic(removedDiscountArray),

      sumTax(removedDiscountArray),

      groups,
      (err) => {
        console.log(err, "error message !!!!!!!!!!!!!!!!");
      },
      (msg) => {
        console.log(msg, "successs message !!!!!!!!!!!!!!!!");
      }
    );
  };

  const sumTotal = (arr) =>
    arr.reduce((sum, { price, qty }) => sum + price * qty, 0);
  const sumBasic = (arr) =>
    arr.reduce((sum, { basic_rate, qty }) => sum + basic_rate * qty, 0);

  const sumTotalDiscount = (arr) =>
    arr.reduce(
      (sum, { item_price, item_qty }) => sum + item_price * item_qty,
      0
    );
  const sumBasicDiscount = (arr) =>
    arr.reduce(
      (sum, { item_basic, item_qty }) => sum + item_basic * item_qty,
      0
    );

  const calculateTax = (income, taxRate) => {
    return income * (taxRate / 100);
  };

  const sumTax = (arr) =>
    arr.reduce(
      (sum, { basic_rate, basic_tax_percent, qty }) =>
        sum + calculateTax(basic_rate, basic_tax_percent) * qty,
      0
    );

  const onCounterBillGenerate = async (custInfo) => {
    const { date, time } = getCurrentDatTime();
    const { totalAmt, disAmt, finalWithTax, discount, totalBasic } =
      getCartTotal2();
    let { bill_id, in_no } = await getLastValues("counter_bills", [
      "bill_id",
      "in_no",
    ]);

    const financialYear = getCurrentFinancialYear();

    const payment = [];
    if (paymentType.setting_name === "MULTI") {
      Object.entries(multiPayment).forEach(([paymentType, amount]) => {
        if (parseFloat(amount) !== 0) {
          const obj = {
            payment_date: date,
            payment_types: "MULTI",
            multi_payment: parseFloat(amount),
            branch: user.branch,
            user_name: user.useid,
            payment_status: "pending",
            paid_amount: 0,
            bill_id: 0,
          };
          console.log("multiPayment", amount, obj);
          payment.push(obj);
        }
      });
    } else {
      const obj = {
        payment_date: date,
        payment_types: paymentType.setting_name,
        multi_payment: Math.round(totalAmt),
        branch: user.branch,
        user_name: user.useid,
        payment_status: "pending",
        paid_amount: 0,
        bill_id: 0,
      };
      payment.push(obj);
    }

    if (in_no === null || in_no === undefined) {
      const response = await getSession("loginData");
      const data = JSON.parse(response);
      in_no = parseInt(data?.counter_bill_id);
    }

    const billData = {
      bno: 0,
      bill_no: "0",
      bill_date: "0",
      bill_time: "0",
      invoice_no: `${user.branch}${financialYear}${parseInt(in_no) + 1}`,
      invoice_date: date,
      invoice_time: time,
      edit_date: "0",
      edit_time: "0",
      cust_name: custInfo.name,
      cust_phone: custInfo.mobile,
      cust_gst: "0",
      cust_address: "0",
      album_no: "0",
      shape: "0",
      remarks: "0",
      ord_taken_by: "0",
      ord_edited_by: "0",
      total_basic_price: totalBasic,
      disc_total_amt: 0.0,
      basic_aft_disc: totalBasic,
      tax_aft_disc: getTotalTaxApplied(),
      disc_given_by: discountDetails.givenBy,
      disc_given_to: discountDetails.givenTo,
      total_amount: Math.round(totalAmt),
      advance_amount: 0.0,
      balance_amount: 0.0,
      paid_amt: Math.round(totalAmt),
      total_paid_amount: Math.round(totalAmt),
      refunded_amt: 0.0,
      mop: paymentType.setting_name,
      final_mop: paymentType.setting_name,
      multi_paytm: multiPayment.multi_paytm,
      multi_card: multiPayment.multi_card,
      multi_cash: multiPayment.multi_cash,
      multi_phonepay: 0.0,
      nc_cust_name: ncModalData.nc_cust_name,
      nc_cust_phone: ncModalData.nc_cust_phone,
      nc_approved_by: ncModalData.nc_approved_by,
      cheque_no: "0",
      cheque_date: "0",
      cheque_bank: "0",
      neft_trans_no: "0",
      neft_date: "0",
      neft_amount: 0.0,
      credit_cust_name: "0",
      credit_cust_phone: "0",
      delivery_date: "0",
      delivery_time: "0",
      delivery_day: "0",
      delivery_mode: "0",
      picked_up_name: "0",
      picked_up_id: "0",
      msg: "0",
      ord_remarks: "0",
      cancelled_date: "0",
      refunded_date: "",
      status: "closed",
      stlmnt_status: "0",
      stlmnt_date: "0",
      branch: user.branch,
      re_print: 1.0,
      sync_status: "pending",
      user_id: user.useid,
      order_type: "0",
      callback_status: "false",
      record_delete: "NO",
      max_postpone_date: "0",
      in_no: parseInt(in_no) + 1,
    };

    let Items = [];
    let payments = [];
    const billId = await inserData("counter_bills", billData);
    if (billId !== null && billId !== undefined) {
      cartList.forEach(async (item) => {
        const data = transformItem(item, billId);
        Items.push(data);
        await inserData("counter_items", data);
      });
      payment.forEach(async (pay) => {
        pay.bill_id = billId;
        payments.push(pay);
        await inserData("counter_payments", pay);
      });
    }
    billData.counter_items = Items;
    billData.counter_payments = payments;
    console.log("billData", cartList);

    let group_to_values = cartList.reduce(function (obj, item) {
      obj[item.cgst_tax] = obj[item.cgst_tax] || [];
      obj[item.cgst_tax].push(item.cgst_tax_amount * item.qty);
      return obj;
    }, {});
    let groups = Object.keys(group_to_values).map(function (key) {
      return {
        cgst: key,
        amount: group_to_values[key].reduce((a, b) => a + b, 0),
      };
    });

    // console.log("groups", groups);

    const groupedItemsByToken = cartList.reduce((acc, item) => {
      if (item?.token === "1") {
        const { tokengroup } = item;
        if (!acc[tokengroup]) {
          acc[tokengroup] = [];
        }
        acc[tokengroup].push(item);
      }
      return acc;
    }, {});

    console.log(groupedItemsByToken);
    // console.log(groupedItems, "groupedItems");

    setGroupedItems(groupedItemsByToken);

    if (Object.keys(groupedItemsByToken).length === 0) {
      NXGBillingModule.onCounterBillGenerate(
        outletDetails?.branch_title,
        outletDetails?.org_name,
        outletDetails?.gstin_no,
        outletDetails?.address1,
        outletDetails?.address2,
        outletDetails?.cin_no,
        cartList,
        outletDetails?.branch,
        billId.toString(),
        `${user.branch}${financialYear}${parseInt(in_no) + 1}`,
        date,
        time,
        sumBasic(cartList),
        sumTotal(cartList),

        sumBasic(cartList),

        sumTax(cartList),

        groups,
        custInfo?.name,
        custInfo?.mobile,
        custInfo?.gstNumber,

        (err) => {
          console.log(err, "error message !!!!!!!!!!!!!!!!");
        },
        (msg) => {
          console.log(msg, "successs message !!!!!!!!!!!!!!!!");
        }
      );
    } else {
      NXGBillingModule.onCounterBillGenerateWithToken(
        outletDetails?.branch_title,
        outletDetails?.org_name,
        outletDetails?.gstin_no,
        outletDetails?.address1,
        outletDetails?.address2,
        outletDetails?.cin_no,
        cartList,
        outletDetails?.branch,
        billId.toString(),
        `${user.branch}${financialYear}${parseInt(in_no) + 1}`,
        date,
        time,
        sumBasic(cartList),
        sumTotal(cartList),

        sumBasic(cartList),

        sumTax(cartList),

        groups,
        Object.keys(groupedItemsByToken).length === 0
          ? ""
          : JSON.stringify(groupedItemsByToken),

        Object.keys(groupedItemsByToken).length === 0 ? null : tokenNumber,
        custInfo?.name,
        custInfo?.mobile,
        custInfo?.gstNumber,

        (err) => {
          console.log(err, "error message !!!!!!!!!!!!!!!!");
        },
        (msg) => {
          console.log(msg, "successs message !!!!!!!!!!!!!!!!");
        }
      );
      setTokenNumber(tokenNumber + 1);
    }

    setIsLoading(false);
    setCustInfo(false);
    setCartList([]);
    setPaymentType({});
    setSelectedDiscount(0);
    setMultipayment({
      multi_paytm: "0.0",
      multi_card: " 0.0",
      multi_cash: " 0.0",
      multi_phonepay: " 0.0",
    });
  };

  const onSync = async () => {
    console.log("noInternet", noInternet);

    if (!noInternet) {
      setSyncErr(true);
    } else {
      setIsLoading(true);
      // const res = await sendGetRequest(COUNTER_API)

      // const urls = user.sales_urls[0]
      // if (res && res.length > 0) {

      //   // iterateUrls(res, urls)

      // }
      const counterBills = await syncCounterBill(
        "counter_bills",
        "counter_items",
        "counter_payments"
      );
      const santeBills = await syncCounterBill(
        "sante_bills",
        "sante_items",
        "sante_discounts"
      );

      if (
        counterBills &&
        counterBills.length == 0 &&
        santeBills &&
        santeBills.length == 0
      ) {
        setNoSyncData(true);
        setIsLoading(false);
        return;
      }

      if (counterBills && counterBills.length > 0) {
        const data = {
          Order: counterBills,
        };
        try {
          console.log("COUNTER SYNC", JSON.stringify(data));
          // const response=null
          const response = await sendPostRequest(
            user.sales_urls[0].Counter_data_synch,
            data
          );
          console.log("Counter bill sync res", response);
          if (response) {
            counterBills.forEach((bill) => {
              updateStatusById("counter_bills", bill.bill_id, "Done");
            });
          }
        } catch (err) {
          console.log("Counter bill sync error", err);
        }
      }
      console.log(santeBills, "santeBills");

      if (santeBills && santeBills.length > 0) {
        const data = {
          Order: santeBills,
        };

        try {
          console.log(`Sante bill Data`, JSON.stringify(data));
          const response = await sendPostRequest(
            user.sales_urls[0].santhe_data_synch,
            data
          );
          console.log("Sante bill sync", response);
          if (response) {
            santeBills.forEach((bill) => {
              updateStatusById("sante_bills", bill.bill_id, "Done");
            });
          }
        } catch (err) {
          console.log("Sante bill sync err", err);
        }
      }
    }

    setIsLoading(false);
    setSyncDone(true);
  };

  const iterateUrls = async (apiResponse, urls) => {
    const apiPromises = [];
    for (const item of apiResponse) {
      const countProperty = Object.keys(item)[0];
      const count = item[countProperty];

      if (count > 0) {
        const apiUrlKey = apiUrlMapping[countProperty];
        if (apiUrlKey) {
          const apiUrl = urls[apiUrlKey];
          // Call your API function here with apiUrl
          console.log(`Making API call for ${apiUrlKey}: ${apiUrl}`);

          try {
            apiPromises.push(
              await getInitialData(
                apiUrlKey,
                apiUrl,
                saveCategories,
                saveProducts,
                saveAppSettings,
                saveMastersCreationData,
                setDiscountList,
                setDiscountType,
                noInternet,
                user.branch,
                setPaymentList,
                setSanteDiscountRatio
              )
            );
          } catch (e) {
            console.error("API calls :", e);
          }
        }
      }
      Promise.all(apiPromises)
        .then(() => {
          // All API calls are resolved, so you can navigate to 'Dashboard'
          setIsLoading(false);
          //  getSanteData()
        })
        .catch((error) => {
          // Handle errors if any of the API calls fail
          setIsLoading(false);
          console.error("API calls failed:", error);
        });
    }
  };

  const syncCounterBill = async (mainTable, itemTable, paymentTable) => {
    let totalBills = [];
    try {
      await getAsyncedData(mainTable)
        .then(async (result) => {
          await Promise.all(
            result.map(async (bill) => {
              bill.counter_items = await getCounterItems(
                bill.bill_id,
                itemTable,
                "bill_id"
              );

              if (mainTable === "counter_bills") {
                bill.counter_payments = await getCounterItems(
                  bill.bill_id,
                  paymentTable,
                  "bill_id"
                );
              } else if (mainTable === "sante_bills") {
                bill.discount = await getCounterItems(
                  bill.bill_id,
                  paymentTable,
                  "bill_id"
                );
                console.log(`${mainTable} discount`, bill.discount);
              }
              totalBills.push(bill);
            })
          );

          // console.log(`${mainTable} Data`, JSON.stringify(totalBills, null, 2));
        })
        .catch((error) => {
          console.error("Error fetching counter bills data:", error);
        });
    } catch (e) {
      console.error("Error e:", e);
    }

    return totalBills;
  };

  const getCounterItems = async (id, tableName, column) => {
    let items = [];
    try {
      await getAllById(tableName, column, id)
        .then((result) => {
          // for (let i = 0; i < result.length; i++) {
          //   response.push(result[i]);
          // }
          items = result;
        })
        .catch((error) => {
          console.error("Error fetching counter items data:", error);
        });
    } catch (e) {
      console.error("Error e:", e);
    }
    return items;
  };

  const onAccept = (data) => {
    setMultipayment(data);
    setIsMultiPayment(false);
  };

  const onNcDone = (data) => {
    console.log("onNcDone", data);
    setNcModalData(data);
    setNcModal(false);
  };

  const cartRefresh = () => {
    setCartList([]);
    setPaymentType({});
    setMultipayment({
      multi_paytm: "0.0",
      multi_card: " 0.0",
      multi_cash: " 0.0",
      multi_phonepay: " 0.0",
    });
    setNcModalData({
      nc_cust_name: "",
      nc_cust_phone: "",
      nc_approved_by: "",
    });
    setDiscountDetails({
      givenBy: "0",
      givenTo: "0",
    });
  };

  const onDayDone = async () => {
    try {
      const response = await sendGetRequest(
        user.sales_urls[0].Counter_day_smstrigger
      );
      if (response.status == "success") {
        setSyncDone(false);
      }
      console.log("onDayDone", response);
    } catch (err) {
      console.log("onDayDone err", err, user.sales_urls[0]);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {isLoading ? <Loader /> : null}

      <Header
        onSearch={(string) => onSearch(string)}
        navigation={navigation}
        onSync={onSync}
      />
      <View
        style={
          isSante && numColumns == 2
            ? styles.santeMobileWrapper
            : isSante && numColumns == 4
            ? styles.santeWrapper
            : styles.mainWrapper
        }
      >
        <View
          style={
            numColumns == 2
              ? styles.mobileItemListWrapper
              : styles.itemListWrapper
          }
        >
          <View style={{ flexDirection: "column", flex: 1 }}>
            <View style={{ flex: 1 }}>
              {products && products.length > 0 ? (
                <FlatList
                  data={products}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      key={item.pr_id}
                      onPress={() => handleAddToCart(item)}
                      style={numColumns == 2 ? styles.mobileItem : styles.item}
                    >
                      <Text
                        style={
                          numColumns == 2 ? styles.mobileTitle : styles.title
                        }
                      >
                        {item.product_name}
                      </Text>
                      {/* <Text style={styles.title}> Rs.{item.price}</Text> */}
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.pr_id}
                  numColumns={numColumns}
                  key={numColumns.toString()}
                />
              ) : (
                <NoData />
              )}
            </View>
          </View>
        </View>
        <View style={styles.cartWrapper}>
          {isSante ? (
            <SanteCart
              cartList={cartList}
              handleQty={handleQty}
              getItemTotal={getItemTotal}
              getItemQty={getItemQty}
              getCartTotal={getCartTotal}
              openNcModal={openNcModal}
              openMulti={openMulti}
              onPaymentSelect={onPaymentSelect}
              paymentType={paymentType}
              paymentList={paymentList}
              setDiscountedItems={setDiscountedItems}
              discountedItems={discountedItems}
              selectedDiscount={selectedDiscount}
              santeDiscountRatio={santeDiscountRatio}
            />
          ) : (
            <NormalCart
              cartList={cartList}
              handleQty={handleQty}
              selectedDiscount={selectedDiscount}
              openNcModal={openNcModal}
              openMulti={openMulti}
              paymentList={paymentList}
              onPaymentSelect={onPaymentSelect}
              paymentType={paymentType}
            />
          )}
        </View>
        <View
          style={{
            width: 120,
            backgroundColor: "gray",
            flexDirection: "column",
            borderLeftWidth: 2,
            borderLeftColor: "black",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          {/* <TouchableOpacity style={styles.optionBtn}>
              <MaterialCommunityIcons name="file-document-edit" size={25} color="black" />
              <Text style={{ color: "black", fontSize: 14 }}>Edit Bill</Text>
  
            </TouchableOpacity> */}
          {appSettings &&
          appSettings.length > 0 &&
          isSettingEnabled("DISCOUNT_BUTTON", appSettings) ? (
            <TouchableOpacity
              disabled={cartList.length == 0}
              style={discountModal ? styles.selectedOpt : styles.optionBtn}
              onPress={() => (isSante ? null : setDiscountModal(true))}
            >
              <Text style={{ color: "black", fontSize: 14 }}>Discount</Text>
            </TouchableOpacity>
          ) : null}

          {appSettings &&
          appSettings.length > 0 &&
          isSettingEnabled("SANTHE_MODULE_BUTTON", appSettings) ? (
            <TouchableOpacity
              style={isSante ? styles.santeSelected : styles.optionBtn}
              onPress={() => enableSante(isSante)}
            >
              <MaterialCommunityIcons name="basket" size={25} color="#FFF" />

              <Text style={{ color: "#FFF", fontSize: 14 }}>Sante</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            disabled={cartList.length == 0}
            style={{
              ...styles.optionBtn,
              backgroundColor: cartList.length == 0 ? "#56A2C8" : "#005e9e",
            }}
            onPress={() => cartRefresh()}
          >
            <MaterialCommunityIcons name="refresh" size={25} color="#FFF" />

            <Text style={{ color: "#FFF", fontSize: 14 }}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={
              cartList.length == 0 ||
              !("setting_name" in paymentType) ||
              getItemQtyWithCarryBag % itemsForDiscount !== 0
            }
            onPress={() =>
              cartList &&
              cartList.length > 0 &&
              "setting_name" in paymentType &&
              isSante
                ? // ? onGenerate()
                  newPrintGenerate()
                : cartList &&
                  cartList.length > 0 &&
                  "setting_name" in paymentType &&
                  !isSante
                ? setCustInfo(true)
                : null
            }
            style={{
              ...styles.optionBtn,
              backgroundColor:
                cartList.length == 0 ||
                !("setting_name" in paymentType) ||
                getItemQtyWithCarryBag % itemsForDiscount !== 0
                  ? "#56A2C8"
                  : "#005e9e",
            }}
          >
            <MaterialCommunityIcons name="printer" size={25} color="#FFF" />

            <Text style={{ color: "#FFF", fontSize: 14 }}>Print TVS</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
              onPress={() => setCustInfo(true)}
              style={{
                ...styles.optionBtn,
                backgroundColor:
                  cartList.length == 0 || !("setting_name" in paymentType)
                    ? "#56A2C8"
                    : "#005e9e",
              }}
            >
              <MaterialCommunityIcons name="printer" size={25} color="#FFF" />
  
              <Text style={{ color: "#FFF", fontSize: 14 }}>Print</Text>
            </TouchableOpacity> */}
          {syncDone ? (
            <TouchableOpacity
              style={styles.optionBtn}
              onPress={() => onDayDone()}
            >
              <MaterialCommunityIcons
                name="check-bold"
                size={25}
                color="black"
              />

              <Text style={{ color: "black", fontSize: 14 }}>Day Done</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {!isSante ? (
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              borderTopColor: "black",
              borderTopWidth: 5,
              flexDirection: "row",

              flexGrow: 1,
            }}
          >
            {categories && categories.length > 0 && !isSante ? (
              <FlatList
                horizontal={numColumns == 2 ? true : false}
                data={categories}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    activeOpacity={0.5}
                    key={item.pr_cat_code}
                    style={
                      cat_id == item.pr_cat_code
                        ? numColumns == 2
                          ? styles.mobileCategorySelectedItem
                          : styles.categorySelectedItem
                        : numColumns == 2
                        ? styles.mobileCategoryItem
                        : styles.categoryItem
                    }
                    onPress={() => {
                      getProductByCat(item.pr_cat_code);
                    }}
                  >
                    <Text style={styles.categoryTitle}>{item.pr_cat_name}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.pr_cat_code}
                key={numColumns.toString()}
                numColumns={numColumns === 4 ? 6 : undefined}
              />
            ) : null}
          </View>
        </ScrollView>
      ) : null}

      {discountModal ? (
        <DiscountModal
          visible={discountModal}
          onClose={() => setDiscountModal(false)}
        />
      ) : null}

      {ncModal ? (
        <NCModal
          visible={ncModal}
          onClose={() => {
            setNcModal(false);
            setPaymentType({});
          }}
          setNcModalData={onNcDone}
          onNcDone={onNcDone}
          ncModalData={ncModalData}
        />
      ) : null}

      {isMultiPayment ? (
        <MultiPayment
          visible={isMultiPayment}
          onClose={() => {
            setIsMultiPayment(false);
            setPaymentType({});
          }}
          totalAmt={getCartTotal()}
          setMultipayment={(data) => onAccept(data)}
          multiPayment={multiPayment}
        />
      ) : null}

      {custInfo ? (
        <CustomerInfo
          visible={custInfo}
          onClose={() => setCustInfo(false)}
          onGenerate={onCounterBillGenerate}
        />
      ) : null}
      {noSyncdata ? (
        <NoDataModal
          visible={noSyncdata}
          onClose={() => setNoSyncData(false)}
          msg="No bills to sync"
        />
      ) : null}
      <SyncModal
        visible={syncErr}
        onClose={() => setSyncErr(false)}
        msg="Please connect to Internet before Sync."
      />
    </SafeAreaView>
  );
};

export default Dashboard;
