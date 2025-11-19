import {SafeAreaView, Dimensions, Platform, Alert} from 'react-native';
import React, {useCallback, useEffect, useState, useMemo} from 'react';
//@ts-ignore
import useStore from '../Redux/Store';
import {sendGetRequest, sendPostRequest} from '../Utils/ApiMethods';
import {useNavigation} from '@react-navigation/native';
//@ts-ignore
import {
  applyDiscount,
  getCurrentDatTime,
  getCurrentFinancialYear,
  getDeviceType,
  transformItem2,
} from '../Utils/Common';
import NetInfo from '@react-native-community/netinfo';
import {inserData, updateStatusById} from '../Utils/sqlite/SqliteInsert';
import {
  getAllById,
  getAsyncedData,
  getLastValues,
} from '../Utils/sqlite/SqliteFetch';
import {NativeModules, Button} from 'react-native';
const {NGXBillingModule} = NativeModules;
const {TVSBillingModule} = NativeModules;
const {UrovoBillingModule} = NativeModules;
const {IminiBillingModule} = NativeModules;
import {requestMultiple, PERMISSIONS} from 'react-native-permissions';
import {getSession} from '../Utils/AsyncStorageFunctions';
import PortraitDashboard from './PortraitDashboard';
import calculateCartValues from '../Services/discountHandler';
import {queueDBInsert} from '../Utils/queue';

const Dashboard = () => {
  // const [cartList, setCartList] = useState<any[]>([]);
  // const [cartMap, setCartMap] = useState({});
  const [discountModal, setDiscountModal] = useState(false);
  const [ncModal, setNcModal] = useState(false);
  const [isSante, setIsSante] = useState(false);
  const [cat_id, setCatId] = useState('');
  const [products, setProducts] = useState([]);
  const [productsRef, setProductsRef] = useState([]);

  const [categories, setCategories] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isMultiPayment, setIsMultiPayment] = useState(false);
  const [custInfo, setCustInfo] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const [paymentType, setPaymentType] = useState<any>({});
  const [noInternet, setNoInternet] = useState(false);
  const [syncErr, setSyncErr] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [noSyncdata, setNoSyncData] = useState(false);

  const [orientation, setOrientation] = useState('LANDSCAPE');
  const [printerDetails, setPrinterDetails] = useState(IminiBillingModule);

  const [normalCartValues, setNormalCartValues] = useState({
    OriginalTotal: '0.00',
    CartTotalBasic: '0.00',
    TotalDiscountAmount: '0.00',
    TotalTaxApplied: '0.00',
    ItemQuantity: 0,
    CartTotal: '0.00',
  });

  const navigation = useNavigation();
  // const[categories,saveCategories]= useStore([])
  const {
    user,
    productCategories,
    productList,
    selectedDiscount,
    paymentList,
    santeData,
    setMultipayment,
    multiPayment,
    setSelectedDiscount,
    setNcModalData,
    setDiscountDetails,
    appSettings,
    setDicountedItemsId,
    santeDiscountRatio,
    outletDetails,
    discountType,
    isDiscountApplied,
    setIsDiscountApplied,
    setPaymentCreds,
    cartMap,
  } = useStore();

  const cartList: any = useMemo(() => Object.values(cartMap), [cartMap]);
  const clearCart = useStore(s => s.clearCart);

  useEffect(() => {
    async function requestBluetooth() {
      console.log(appSettings, 'requesting');
      let androidPermissions = [
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      ];
      const OsVer: any = Platform.constants['Release'];

      if (OsVer > 12) {
        const statuses = await requestMultiple(androidPermissions);
        // return Object.values(statuses).some(el => el === RESULTS.GRANTED);
      }
    }

    requestBluetooth();
  }, []);

  useEffect(() => {
    const deviceType = getDeviceType();
    console.log('deviceType', deviceType);
    // Set numColumns based on screen width
    if (deviceType == 'Mobile') {
      setNumColumns(2);
    } else {
      setNumColumns(4);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setNoInternet(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    Dimensions.addEventListener('change', ({window: {width, height}}) => {
      if (width < height) {
        setOrientation('PORTRAIT');
      } else {
        setOrientation('LANDSCAPE');
      }
    });
  }, []);

  useEffect(() => {
    const height = Dimensions.get('window').height;
    const width = Dimensions.get('window').width;
    if (width < height) {
      setOrientation('PORTRAIT');
    } else {
      setOrientation('LANDSCAPE');
    }
  });

  useEffect(() => {
    let defaultValues;
    if (paymentList.length == 1) {
      setPaymentType(paymentList[0]);
    }

    if (discountType === 'DEFAULT_DISCOUNT' && isDiscountApplied) {
      defaultValues = calculateCartValues(
        cartList,
        discountType,
        0,
        isDiscountApplied,
      );
    } else {
      defaultValues = calculateCartValues(
        cartList,
        discountType,
        selectedDiscount,
        isDiscountApplied,
      );
    }
    setNormalCartValues(defaultValues);
  }, [cartList, isDiscountApplied, discountType, selectedDiscount]);

  useEffect(() => {
    const getPrinter = async () => {
      const response = await getPrinterDetails();

      switch (response[0]?.name) {
        case 'Imini':
          setPrinterDetails(IminiBillingModule);
          break;
        case 'NGX':
          setPrinterDetails(NGXBillingModule);
          break;
        case 'TVS':
          setPrinterDetails(TVSBillingModule);
          break;
        case 'Urovo':
          setPrinterDetails(UrovoBillingModule);
          break;
        default:
          setPrinterDetails(IminiBillingModule);
          break;
      }
    };
    getPrinter();
  }, []);

  useEffect(() => {
    const getPayment = async () => {
      const response = await getPaymentCredentials();

      setPaymentCreds(response);
    };
    getPayment();
  }, []);

  const getPaymentCredentials = async () => {
    try {
      const response = await sendGetRequest(
        `${user.sales_urls[0].get_payment_credentials}/${user.branch}`,
      );
      console.log('Payment credentials:', response);
      // setPaymentCredentials(response);
      return response;
    } catch (error) {
      console.error('Error getting payment credentials:', error);
      Alert.alert(
        'Error',
        'Failed to get payment credentials. Please try again.',
      );
    }
  };

  const getPrinterDetails = async () => {
    try {
      const response = await sendGetRequest(
        `${user.sales_urls[0].get_printer_details}/${user.branch}`,
      );

      console.log('response getPrinterDetails', response);

      return response;
    } catch (error) {
      console.log('error getPrinterDetails', error);
      return null;
    }
  };

  // const handleAddToCart = (item: any) => {
  //   const updatedCartList: any = [...cartList];
  //   const index = updatedCartList.findIndex(
  //     (cartItem: any) => cartItem.pr_id === item.pr_id,
  //   );

  //   if (index !== -1) {
  //     // updatedCartList[index].qty += 1;
  //     updatedCartList[index] = {
  //       ...updatedCartList[index],
  //       qty: updatedCartList[index].qty + 1,
  //     };
  //   } else {
  //     // item.qty = 1;
  //     // updatedCartList.push(item);
  //     const newItem = {...item, qty: 1};
  //     updatedCartList.push(newItem);
  //   }

  //   setCartList(updatedCartList);
  // };

  // const handleAddToCart = useCallback((item: any) => {
  //   setCartList((prev: any) => {
  //     const index = prev.findIndex((p: any) => p.pr_id === item.pr_id);

  //     if (index !== -1) {
  //       // update qty
  //       const updated = [...prev];
  //       updated[index] = {
  //         ...updated[index],
  //         qty: updated[index].qty + 1,
  //       };
  //       return updated;
  //     }

  //     return [...prev, {...item, qty: 1}];
  //   });
  // }, []);

  const getItemTotal = () => {
    return cartList.reduce(
      (total: any, item: any) => total + parseInt(item.basic_rate),
      0,
    );
  };

  const getItemQty = () => {
    return cartList.reduce((total: any, item: any) => total + item.qty, 0);
  };
  const getItemQtyWithCarryBag = useMemo(() => {
    const pattern = /^Carry Bag/;
    const updatedCartWithoutCarryBag = cartList.filter(
      (item: any) => !pattern.test(item.product_name),
    );

    return updatedCartWithoutCarryBag.reduce(
      (total: any, item: any) => total + item.qty,
      0,
    );
  }, [cartList]);

  const [itemsForDiscount, discountPerSet] = santeDiscountRatio
    .split(':')
    .map(Number);

  const getCartTotal = () => {
    const totalAmt = cartList.reduce((total: any, item: any) => {
      const itemTotal = item.qty * parseFloat(item.basic_rate);
      const itemDiscountedTotal =
        itemTotal - (itemTotal * parseInt(item.discount_perc)) / 100;

      const taxPercentage = parseInt(item.basic_tax_percent);
      const taxAmount = (itemDiscountedTotal * taxPercentage) / 100;

      // Instead of modifying the original item, we create a new object with the tax amount included
      const updatedItem = {
        ...item,
        item_tax_amt: taxAmount.toFixed(2),
      };

      console.log('itemDiscountedTotal with tax:', updatedItem.item_tax_amt);
      return total + itemDiscountedTotal + taxAmount;
    }, 0);

    return Number(totalAmt.toFixed(0));
  };

  // const handleQty = (type: any, item: any, count: any) => {
  //   const updatedCartList: any = [...cartList];
  //   const index = updatedCartList.findIndex(
  //     (cartItem: any) => cartItem.pr_id === item.pr_id,
  //   );

  //   if (index !== -1) {
  //     if (type === 'delete') {
  //       updatedCartList[index].qty === 0;
  //       updatedCartList.splice(index, 1);
  //     } else if (type == 'bulk' && count < 99) {
  //       if (count == null || count == undefined || count <= 0) {
  //         updatedCartList[index].qty = 1;
  //       } else {
  //         updatedCartList[index].qty = count;
  //       }
  //     } else {
  //       if (type === 'remove' && updatedCartList[index].qty > 1) {
  //         updatedCartList[index].qty = parseInt(updatedCartList[index].qty) - 1;
  //       } else if (type === 'add') {
  //         updatedCartList[index].qty = parseInt(updatedCartList[index].qty) + 1;
  //       }

  //       if (updatedCartList[index].qty === 0) {
  //         updatedCartList.splice(index, 1);
  //       }
  //     }
  //   }

  //   setCartList(updatedCartList);
  // };

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

  const getProductByCat = (id: any) => {
    let value: any = 0;
    if (cat_id !== '') {
      value = cat_id;
    } else {
      value = id;
    }

    const res =
      productList && productList.filter((item: any) => item.pr_cat_id == id);
    // console.log("cat ID", id,res);
    setProducts(res);
    setProductsRef(res);
    setCatId(id);
    setIsLoading(false);
  };

  const onSearch = (value: any) => {
    if (value !== '') {
      const searchResults = productsRef.filter((item: any) =>
        item.product_name.toLowerCase().includes(value.toLowerCase()),
      );
      setProducts(searchResults);
    } else {
      setProducts(productsRef);
    }
  };

  const enableSante = (isOn: any) => {
    if (isOn) {
      setIsSante(false);
      getProductByCat(productCategories[0]?.pr_cat_code);
      // getProductByCat(215);
      clearCart();
    } else {
      setIsSante(true);
      getProductByCat(productCategories[0]?.pr_cat_code);
      // getProductByCat(215)
      setProducts(santeData);
      setProductsRef(santeData);
      clearCart();
    }
  };

  const onPaymentSelect = (item: any) => {
    setPaymentType(item);
    switch (item.setting_name) {
      case 'NC':
        openNcModal();
        setMultipayment({
          multi_paytm: '0.0',
          multi_card: ' 0.0',
          multi_cash: ' 0.0',
          multi_phonepay: ' 0.0',
        });
        break;
      case 'MULTI':
        openMulti();
        break;
      default:
        setMultipayment({
          multi_paytm: '0.0',
          multi_card: ' 0.0',
          multi_cash: ' 0.0',
          multi_phonepay: ' 0.0',
        });
    }
  };

  const getCartTotal2 = () => {
    const finalAmt: any = cartList.reduce((total: any, item: any) => {
      const itemTotal: any = item.qty * parseFloat(item.basic_rate);

      // Check if discount_perc is null or undefined and default to 0 if it is
      const discountPerc = item.discount_perc
        ? parseInt(item.discount_perc)
        : 0;
      const itemDiscountedTotal = itemTotal - (itemTotal * discountPerc) / 100;

      // Check if tax percent is null or undefined and default to 0 if it is
      const taxPercentage = item.basic_tax_percent
        ? parseInt(item.basic_tax_percent)
        : 0;
      const taxAmount = (itemDiscountedTotal * taxPercentage) / 100;

      return total + itemDiscountedTotal + taxAmount;
    }, 0);

    const totalAmt: any = cartList.reduce(
      (total: any, item: any) => total + item.qty * parseInt(item.basic_rate),
      0,
    );

    const disAmt = totalAmt - (totalAmt * selectedDiscount) / 100;
    const finalWithTax = disAmt + (disAmt * 18) / 100;
    const discount = totalAmt - disAmt;
    const totalBasic = cartList.reduce(
      (total: any, item: any) => total + item.qty * parseFloat(item.basic_rate),
      0,
    );

    return {
      totalAmt: finalAmt,
      disAmt: disAmt,
      finalWithTax: finalWithTax,
      discount: discount,
      totalBasic: totalBasic,
    };
  };

  const newPrintGenerate = async () => {
    console.log('cleckeddd');

    setIsLoading(true);
    const {totalAmt, disAmt, finalWithTax, discount} = getCartTotal2();
    const {date, time} = getCurrentDatTime();
    const pattern = /^Carry Bag/;
    let reqObj: any = {};
    let updatedCartWithoutcarryBag = cartList.filter(
      (item: any) => !pattern.test(item.product_name),
    );
    const {discountedCart, totalPrice, totalBasic, discountedItemsId}: any =
      applyDiscount(updatedCartWithoutcarryBag, santeDiscountRatio);

    setDicountedItemsId(discountedItemsId);

    let {bill_id} = await getLastValues('sante_bills', ['bill_id']);

    if (bill_id === null || bill_id === undefined) {
      const response: any = await getSession('loginData');
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
        sync_status: 'pending',
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
        sync_status: 'pending',
      };
    }

    console.log(reqObj, 'reqObjreqObj');

    await inserData('sante_bills', reqObj);
    let sante_discounts = [];
    let sante_items = [];
    let itemId;
    let catId = 0;
    // console.log("discountedCart", discountedCart);
    if (discountedCart.length > 0 && bill_id != null) {
      console.log(discountedCart, 'discountedCart123');

      for (const item of discountedCart) {
        const baseData = {
          item_id: item?.pr_id,
          item_name: item.product_name,
          item_qty: item.qty,
          item_price: parseInt(item.price) * item.qty,
          item_basic: item.basic_rate * item.qty,
          item_tax_percent: '0',
          basic_tax: '0',
          cat_id: item.pr_cat_id,
          item_discount: '0',
          item_taxable: item.price,
          item_discount_tax_amount: 0,
          bill_id: bill_id + 1,
          bill_date: date,
          branch_name: user.branch,
        };

        if (discountedItemsId.includes(item.pr_id)) {
          catId = item.pr_id;
        }
        await inserData('sante_items', baseData);
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
            console.log('catId 3', catId);
            sante_discounts.push(obj);
            await inserData('sante_discounts', obj);
          } else {
            let {item_id} = await getLastValues('sante_items', ['item_id']);

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
            await inserData('sante_discounts', obj);
          }
        }
      }
    }
    reqObj.sante_items = sante_items;
    reqObj.sante_discounts = sante_discounts;

    console.log('sante_bills', reqObj);
    setIsLoading(false);
    setCustInfo(false);
    clearCart();
    setPaymentType({});
    setSelectedDiscount(0);
    setMultipayment({
      multi_paytm: '0.0',
      multi_card: ' 0.0',
      multi_cash: ' 0.0',
      multi_phonepay: ' 0.0',
    });
    setDicountedItemsId([]);
    enableSante(false);

    var res: any = {};
    sante_discounts.map(e => {
      if (!res[e.id]) res[e.id] = Object.assign({}, e); // clone
      else res[e.id].item_qty += e.item_qty;
    });
    let mergedDiscountArray = Object.values(res);
    let removedDiscountArray = cartList.map((cv: any) => {
      // console.log(cv, "removedisss");
      let quantity = cv.qty;
      mergedDiscountArray.find(function (e: any) {
        // console.log(e, "inside removee");
        if (e.id == cv.id) {
          console.log('inside iddd');
          quantity = cv.qty - e.item_qty;
        }
        console.log(quantity, 'quantity');
      });
      return {...cv, qty: quantity};
    });
    let group_to_values = removedDiscountArray.reduce(function (
      obj: any,
      item: any,
    ) {
      obj[item.cgst_tax] = obj[item.cgst_tax] || [];
      obj[item.cgst_tax].push(item.cgst_tax_amount * item.qty);
      return obj;
    },
    {});
    let groups = Object.keys(group_to_values).map(function (key: any) {
      return {
        cgst: key,
        amount: group_to_values[key].reduce((a: any, b: any) => a + b, 0),
      };
    });

    printerDetails.santhePrint(
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
      (err: any) => {
        console.log(err, 'error message !!!!!!!!!!!!!!!!');
      },
      (msg: any) => {
        console.log(msg, 'successs message !!!!!!!!!!!!!!!!');
      },
    );
  };

  const sumTotal = (arr: any) =>
    Math.round(
      arr.reduce((sum: any, {price, qty}: any) => sum + price * qty, 0) * 100,
    ) / 100;
  const sumBasic = (arr: any) =>
    arr.reduce((sum: any, {basic_rate, qty}: any) => sum + basic_rate * qty, 0);

  const sumTotalDiscount = (arr: any) =>
    arr.reduce(
      (sum: any, {item_price, item_qty}: any) => sum + item_price * item_qty,
      0,
    );
  const sumBasicDiscount = (arr: any) =>
    arr.reduce(
      (sum: any, {item_basic, item_qty}: any) => sum + item_basic * item_qty,
      0,
    );

  const calculateTax = (income: any, taxRate: any) => {
    return income * (taxRate / 100);
  };

  const sumTax = (arr: any) =>
    arr.reduce(
      (sum: any, {basic_rate, basic_tax_percent, qty}: any) =>
        sum + calculateTax(basic_rate, basic_tax_percent) * qty,
      0,
    );

  // const onCounterBillGenerate = async () => {
  //   // IminiBillingModule.dummy();
  //   const receiptData = {
  //     orderNumber: "220411A0015",
  //     title: "RECEIPT",
  //     date: new Date().toLocaleString(),
  //     items: [
  //       { name: "Item 1", price: "$10.00" },
  //       { name: "Item 2", price: "$15.00" },
  //       { name: "Item 3", price: "$25.00" },
  //     ],
  //     total: "$50.00",
  //   };

  // const onCounterBillGenerate1 = () => {
  //   const receiptData = {
  //     orderNumber: "220411A0015",
  //     title: "RECEIPT",
  //     date: new Date().toLocaleString(),
  //     items: [
  //       { name: "Item 1", price: "$10.00" },
  //       { name: "Item 2", price: "$15.00" },
  //       { name: "Item 3", price: "$25.00" },
  //     ],
  //     total: "$50.00",
  //   };
  //   return new Promise((resolve, reject) => {
  //     // Pass both receiptData and callback to the native method
  //     IminiBillingModule.printReceiptComplete(
  //       receiptData,
  //       (error: any, message: any) => {
  //         if (error) {
  //           reject(error);
  //         } else {
  //           resolve(message);
  //         }
  //       }
  //     );
  //   });
  //   // },
  // };

  // const onCounterBillGenerate = async (custInfo: any) => {
  //   let showTax = false;

  //   const santheSetting = appSettings.find(
  //     (setting: any) => setting.setting_name === 'HSN_DISPLAY_OPTION',
  //   );

  //   if (santheSetting) {
  //     const access = santheSetting.setting_access;
  //     if (access === '0' || access === 0) {
  //       // setShowTax(false);
  //       showTax = false;
  //     } else if (access === '1' || access === 1) {
  //       // setShowTax(true);
  //       showTax = true;
  //     }
  //   }

  //   const {date, time, dateISO} = getCurrentDatTime();
  //   const {totalAmt, disAmt, finalWithTax, discount, totalBasic} =
  //     getCartTotal2();
  //   let {bill_id, in_no} = await getLastValues('counter_bills', [
  //     'bill_id',
  //     'in_no',
  //   ]);

  //   let {item_id} = await getLastValues('counter_items', ['item_id']);

  //   let {payment_id} = await getLastValues('counter_payments', ['payment_id']);

  //   const financialYear = getCurrentFinancialYear();

  //   const payment = [];
  //   if (paymentType.setting_name === 'MULTI') {
  //     Object.entries(multiPayment).forEach(([paymentType, amount]: any) => {
  //       if (parseFloat(amount) !== 0) {
  //         const obj = {
  //           payment_date: date,
  //           payment_types: 'MULTI',
  //           multi_payment: parseFloat(amount),
  //           branch: user.branch,
  //           user_name: user.useid,
  //           payment_status: 'pending',
  //           paid_amount: 0,
  //           bill_id: 0,
  //           payment_id: 0,
  //         };
  //         console.log('multiPayment', amount, obj);
  //         payment.push(obj);
  //       }
  //     });
  //   } else {
  //     const obj = {
  //       payment_date: date,
  //       payment_types: paymentType.setting_name,
  //       multi_payment: Math.round(totalAmt),
  //       branch: user.branch,
  //       user_name: user.useid,
  //       payment_status: 'pending',
  //       paid_amount: 0,
  //       bill_id: 0,
  //       payment_id: 0,
  //     };
  //     payment.push(obj);
  //   }

  //   if (in_no === null || in_no === undefined) {
  //     const response: any = await getSession('loginData');
  //     const data = JSON.parse(response);
  //     if (
  //       data?.counter_bill_id !== null &&
  //       data?.counter_bill_id !== undefined
  //     ) {
  //       in_no = parseInt(data?.counter_bill_id);
  //     } else {
  //       in_no = 0;
  //     }
  //   }

  //   if (item_id == null || item_id == undefined) {
  //     const response: any = await getSession('loginData');
  //     const data = JSON.parse(response);
  //     if (
  //       data?.counter_item_id !== null &&
  //       data?.counter_item_id !== undefined
  //     ) {
  //       item_id = parseInt(data?.counter_item_id);
  //     } else {
  //       item_id = 0;
  //     }
  //   }

  //   if (payment_id == null || payment_id == undefined) {
  //     const response: any = await getSession('loginData');
  //     const data = JSON.parse(response);
  //     if (
  //       data?.counter_payment_id !== null &&
  //       data?.counter_payment_id !== undefined
  //     ) {
  //       payment_id = parseInt(data?.counter_payment_id);
  //     } else {
  //       payment_id = 0;
  //     }
  //   }

  //   const billData: any = {
  //     bill_id: parseInt(in_no) + 1,
  //     bno: 0,
  //     bill_no: '0',
  //     bill_date: '0',
  //     bill_time: '0',
  //     invoice_no: `${user.branch}${financialYear}${parseInt(in_no) + 1}`,
  //     invoice_date: dateISO,
  //     invoice_time: time,
  //     edit_date: '0',
  //     edit_time: '0',
  //     cust_name: custInfo.name,
  //     cust_phone: custInfo.mobile,
  //     cust_gst: '0',
  //     cust_address: '0',
  //     album_no: '0',
  //     shape: '0',
  //     remarks: '0',
  //     ord_taken_by: '0',
  //     ord_edited_by: '0',
  //     total_basic_price: totalBasic,
  //     disc_total_amt: 0.0,
  //     basic_aft_disc: calculateTotalItemTaxableAmount(
  //       cartList,
  //       applyDiscount,
  //       discountType,
  //       selectedDiscount,
  //     ),
  //     tax_aft_disc: calculateItemTaxAmt(
  //       cartList,
  //       applyDiscount,
  //       discountType,
  //       selectedDiscount,
  //     ),
  //     disc_given_by: discountDetails.givenBy,
  //     disc_given_to: discountDetails.givenTo,
  //     total_amount: Math.round(totalAmt),
  //     advance_amount: 0.0,
  //     balance_amount: 0.0,
  //     paid_amt: Math.round(totalAmt),
  //     total_paid_amount: Math.round(totalAmt),
  //     refunded_amt: 0.0,
  //     mop: paymentType.setting_name,
  //     final_mop: paymentType.setting_name,
  //     multi_paytm: multiPayment.multi_paytm,
  //     multi_card: multiPayment.multi_card,
  //     multi_cash: multiPayment.multi_cash,
  //     multi_phonepay: 0.0,
  //     nc_cust_name: ncModalData.nc_cust_name,
  //     nc_cust_phone: ncModalData.nc_cust_phone,
  //     nc_approved_by: ncModalData.nc_approved_by,
  //     cheque_no: '0',
  //     cheque_date: '0',
  //     cheque_bank: '0',
  //     neft_trans_no: '0',
  //     neft_date: '0',
  //     neft_amount: 0.0,
  //     credit_cust_name: '0',
  //     credit_cust_phone: '0',
  //     delivery_date: '0',
  //     delivery_time: '0',
  //     delivery_day: '0',
  //     delivery_mode: '0',
  //     picked_up_name: '0',
  //     picked_up_id: '0',
  //     msg: '0',
  //     ord_remarks: '0',
  //     cancelled_date: '0',
  //     refunded_date: '',
  //     status: 'closed',
  //     stlmnt_status: '0',
  //     stlmnt_date: '0',
  //     branch: user.branch,
  //     re_print: 1.0,
  //     sync_status: 'pending',
  //     user_id: user.useid,
  //     order_type: '0',
  //     callback_status: 'false',
  //     record_delete: 'NO',
  //     max_postpone_date: '0',
  //     in_no: parseInt(in_no) + 1,
  //   };

  //   let Items: any = [];
  //   let payments: any = [];
  //   await inserData('counter_bills', billData);
  //   let billId = parseInt(in_no) + 1;
  //   if (billId !== null && billId !== undefined) {
  //     try {
  //       // Process items sequentially
  //       for (let index = 0; index < cartList.length; index++) {
  //         const item = cartList[index];
  //         const data = transformItem2(
  //           item,
  //           billId,
  //           item_id + index,
  //           discountType,
  //           selectedDiscount,
  //           isDiscountApplied,
  //         );
  //         Items.push(data);
  //         await inserData('counter_items', data);
  //       }

  //       // Process payments sequentially
  //       for (const pay of payment) {
  //         pay.payment_id = parseInt(payment_id) + 1;
  //         pay.bill_id = billId;
  //         payments.push(pay);
  //         await inserData('counter_payments', pay);
  //       }
  //     } catch (error) {
  //       console.error('Database insertion error:', error);
  //     }
  //   }
  //   billData.counter_items = Items;
  //   billData.counter_payments = payments;
  //   console.log('billData', cartList);

  //   let group_to_values = cartList.reduce(function (obj: any, item: any) {
  //     obj[item.cgst_tax] = obj[item.cgst_tax] || [];
  //     obj[item.cgst_tax].push(item.cgst_tax_amount * item.qty);
  //     return obj;
  //   }, {});
  //   let groups = Object.keys(group_to_values).map(function (key) {
  //     return {
  //       cgst: key,
  //       amount: group_to_values[key].reduce((a: any, b: any) => a + b, 0),
  //     };
  //   });

  //   // console.log("groups", groups);

  //   const groupedItemsByToken = cartList.reduce((acc: any, item: any) => {
  //     if (item?.token === '1') {
  //       const {tokengroup} = item;
  //       if (!acc[tokengroup]) {
  //         acc[tokengroup] = [];
  //       }
  //       acc[tokengroup].push(item);
  //     }
  //     return acc;
  //   }, {});

  //   const processTokenGroup = (
  //     groupKey: string,
  //     groupItems: any[],
  //     remainingGroups: string[],
  //   ) => {
  //     const singleGroupData = {[groupKey]: groupItems};

  //     Alert.alert(
  //       'Alert',
  //       `Do you want to print KOT?`,
  //       [
  //         {
  //           text: 'Cancel',
  //           onPress: () => {
  //             console.log(`Cancel Pressed for ${groupKey}`);
  //             // Process next group if available
  //             if (remainingGroups.length > 0) {
  //               const nextGroupKey = remainingGroups[0];
  //               const nextGroupItems = groupedItemsByToken[nextGroupKey];
  //               const nextRemainingGroups = remainingGroups.slice(1);
  //               processTokenGroup(
  //                 nextGroupKey,
  //                 nextGroupItems,
  //                 nextRemainingGroups,
  //               );
  //             }
  //           },
  //           style: 'cancel',
  //         },
  //         {
  //           text: 'OK',
  //           onPress: () => {
  //             printerDetails.onCounterBillGenerateWithToken(
  //               outletDetails?.branch_title,
  //               outletDetails?.org_name,
  //               outletDetails?.gstin_no,
  //               outletDetails?.address1,
  //               outletDetails?.address2,
  //               outletDetails?.cin_no,
  //               groupItems, // Send only current group items
  //               outletDetails?.branch,
  //               billId.toString(),
  //               `${user.branch}${financialYear}${parseInt(in_no) + 1}`,
  //               date,
  //               time,
  //               normalCartValues?.CartTotalBasic,
  //               normalCartValues?.CartTotal,
  //               normalCartValues?.CartTotalBasic,
  //               normalCartValues?.TotalTaxApplied,
  //               groups,
  //               JSON.stringify(singleGroupData), // Send only current group
  //               tokenNumber,
  //               custInfo?.name,
  //               custInfo?.mobile,
  //               custInfo?.gstNumber,
  //               showTax,
  //               (err: any) => {
  //                 console.log(err, 'error message !!!!!!!!!!!!!!!!');
  //               },
  //               (msg: any) => {
  //                 console.log(msg, 'success message !!!!!!!!!!!!!!!!');
  //               },
  //             );

  //             setTokenNumber(tokenNumber + 1);

  //             // Process next group if available
  //             if (remainingGroups.length > 0) {
  //               const nextGroupKey = remainingGroups[0];
  //               const nextGroupItems = groupedItemsByToken[nextGroupKey];
  //               const nextRemainingGroups = remainingGroups.slice(1);
  //               processTokenGroup(
  //                 nextGroupKey,
  //                 nextGroupItems,
  //                 nextRemainingGroups,
  //               );
  //             }
  //           },
  //         },
  //       ],
  //       {cancelable: false},
  //     );
  //   };

  //   console.log(groupedItemsByToken, 'groupedItemsByToken');
  //   console.log(groupedItems, 'groupedItems');

  //   setGroupedItems(groupedItemsByToken);
  //   printerDetails.onCounterBillGenerate(
  //     outletDetails?.branch_title,
  //     outletDetails?.org_name,
  //     outletDetails?.gstin_no,
  //     outletDetails?.address1,
  //     outletDetails?.address2,
  //     outletDetails?.cin_no,
  //     cartList,
  //     outletDetails?.branch,
  //     billId.toString(),
  //     `${user.branch}${financialYear}${parseInt(in_no) + 1}`,
  //     date,
  //     time,
  //     // sumBasic(cartList),
  //     normalCartValues?.CartTotalBasic,
  //     // sumTotal(cartList),
  //     normalCartValues?.CartTotal,
  //     // sumBasic(cartList),
  //     normalCartValues?.CartTotalBasic,
  //     // sumTax(cartList),
  //     normalCartValues?.TotalTaxApplied,
  //     groups,
  //     custInfo?.name,
  //     custInfo?.mobile,
  //     custInfo?.gstNumber,
  //     showTax,
  //     (err: any) => {
  //       console.log(err, 'error message !!!!!!!!!!!!!!!!');
  //     },
  //     (msg: any) => {
  //       console.log(msg, 'successs message !!!!!!!!!!!!!!!!');
  //     },
  //   );

  //   if (Object.keys(groupedItemsByToken).length !== 0) {
  //     const groupKeys = Object.keys(groupedItemsByToken);
  //     const firstGroupKey = groupKeys[0];
  //     const firstGroupItems = groupedItemsByToken[firstGroupKey];
  //     const remainingGroups = groupKeys.slice(1);

  //     processTokenGroup(firstGroupKey, firstGroupItems, remainingGroups);
  //   }

  //   setIsLoading(false);
  //   setCustInfo(false);
  //   setCartMap({});
  //   setPaymentType({});
  //   setSelectedDiscount(0);
  //   setMultipayment({
  //     multi_paytm: '0.0',
  //     multi_card: ' 0.0',
  //     multi_cash: ' 0.0',
  //     multi_phonepay: ' 0.0',
  //   });
  //   setNcModalData({
  //     nc_cust_name: '',
  //     nc_cust_phone: '',
  //     nc_approved_by: '',
  //   });
  // };

  const onCounterBillGenerate = async (custInfo: any) => {
    setIsPrinting(true);

    /** ✅ 1️⃣  Collect tax flag */
    let showTax = false;
    const santheSetting = appSettings.find(
      (setting: any) => setting.setting_name === 'HSN_DISPLAY_OPTION',
    );
    if (santheSetting?.setting_access === '1') showTax = true;

    /** ✅ 2️⃣  Get time + totals */
    const {date, time, dateISO} = getCurrentDatTime();
    const {totalAmt, disAmt, finalWithTax, discount, totalBasic} =
      getCartTotal2();

    /** ✅ 3️⃣  Get last IDs */
    let {bill_id, in_no} = await getLastValues('counter_bills', [
      'bill_id',
      'in_no',
    ]);
    let {item_id} = await getLastValues('counter_items', ['item_id']);
    let {payment_id} = await getLastValues('counter_payments', ['payment_id']);

    /** Fallback from session */
    const loginData: any = JSON.parse(await getSession('loginData'));
    in_no = in_no ?? loginData.counter_bill_id ?? 0;
    item_id = item_id ?? loginData.counter_item_id ?? 0;
    payment_id = payment_id ?? loginData.counter_payment_id ?? 0;

    const financialYear = getCurrentFinancialYear();

    /** ✅ 4️⃣ Build billData */
    const billData: any = {
      bill_id: parseInt(in_no) + 1,
      invoice_no: `${user.branch}${financialYear}${parseInt(in_no) + 1}`,
      invoice_date: dateISO,
      invoice_time: time,
      cust_name: custInfo.name,
      cust_phone: custInfo.mobile,
      total_basic_price: totalBasic,
      total_amount: Math.round(totalAmt),
      paid_amt: Math.round(totalAmt),
      total_paid_amount: Math.round(totalAmt),
      mop: paymentType.setting_name,
      final_mop: paymentType.setting_name,
      branch: user.branch,
      user_id: user.useid,
      status: 'closed',
      sync_status: 'pending',
      in_no: parseInt(in_no) + 1,
    };

    /** ✅ 5️⃣ Items + payments */
    let Items: any[] = [];
    let payments: any[] = [];

    cartList.forEach((item: any, index: number) => {
      const data = transformItem2(
        item,
        billData.bill_id,
        item_id + index,
        discountType,
        selectedDiscount,
        isDiscountApplied,
      );
      Items.push(data);
    });

    const paymentList = [];
    if (paymentType.setting_name === 'MULTI') {
      Object.entries(multiPayment).forEach(([k, v]: any) => {
        if (+v !== 0) {
          payments.push({
            payment_id: payment_id++,
            bill_id: billData.bill_id,
            payment_types: 'MULTI',
            multi_payment: +v,
            payment_status: 'pending',
          });
        }
      });
    } else {
      payments.push({
        payment_id: payment_id++,
        bill_id: billData.bill_id,
        payment_types: paymentType.setting_name,
        multi_payment: Math.round(totalAmt),
        payment_status: 'pending',
      });
    }

    /** ✅ 7️⃣ Print Immediately (FAST ✅) */
    printerDetails.onCounterBillGenerate(
      outletDetails?.branch_title,
      outletDetails?.org_name,
      outletDetails?.gstin_no,
      outletDetails?.address1,
      outletDetails?.address2,
      outletDetails?.cin_no,
      cartList,
      outletDetails?.branch,
      billData.bill_id.toString(),
      billData.invoice_no,
      date,
      time,
      normalCartValues?.CartTotalBasic,
      normalCartValues?.CartTotal,
      normalCartValues?.CartTotalBasic,
      normalCartValues?.TotalTaxApplied,
      [], // groups if needed
      custInfo?.name,
      custInfo?.mobile,
      custInfo?.gstNumber,
      showTax,
      (err: any) => {
        console.log(err, 'error message !!!!!!!!!!!!!!!!');
      },
      (msg: any) => {
        console.log(msg, 'successs message !!!!!!!!!!!!!!!!');
        /** ✅ 6️⃣ Queue DB work → runs async + retry */
        queueDBInsert({
          billData,
          items: Items,
          payments,
        });
      },
    );

    /** ✅ 8️⃣ Reset UI */
    setIsPrinting(false);
    setCustInfo(false);
    clearCart();
    setPaymentType({});
    setSelectedDiscount(0);

    setMultipayment({
      multi_paytm: '0.0',
      multi_card: '0.0',
      multi_cash: '0.0',
      multi_phonepay: '0.0',
    });

    setNcModalData({
      nc_cust_name: '',
      nc_cust_phone: '',
      nc_approved_by: '',
    });
  };

  const onSync = async () => {
    console.log('noInternet', noInternet);

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
        setNoSyncData(true);
        setIsLoading(false);
        return;
      }

      if (counterBills && counterBills.length > 0) {
        const data = {
          Order: counterBills,
        };
        try {
          console.log('COUNTER SYNC', JSON.stringify(data));
          // const response=null
          const response = await sendPostRequest(
            user.sales_urls[0].Counter_data_synch,
            data,
          );
          console.log('Counter bill sync res', response);
          if (response) {
            counterBills.forEach((bill: any) => {
              updateStatusById('counter_bills', bill.bill_id, 'Done');
            });
          }
        } catch (err) {
          console.log('Counter bill sync error', err);
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
          console.log('Sante bill sync err', err);
        }
      }
    }

    setIsLoading(false);
    setSyncDone(true);
  };

  const syncCounterBill = async (
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

  const onAccept = (data: any) => {
    setMultipayment(data);
    setIsMultiPayment(false);
  };

  const onNcDone = (data: any) => {
    console.log('onNcDone', data);
    setNcModalData(data);
    setNcModal(false);
  };

  const cartRefresh = () => {
    clearCart();
    setPaymentType({});
    setMultipayment({
      multi_paytm: '0.0',
      multi_card: ' 0.0',
      multi_cash: ' 0.0',
      multi_phonepay: ' 0.0',
    });
    setNcModalData({
      nc_cust_name: '',
      nc_cust_phone: '',
      nc_approved_by: '',
    });
    setDiscountDetails({
      givenBy: '0',
      givenTo: '0',
    });
    setIsDiscountApplied(false);
    setSelectedDiscount(0);
  };

  const onDayDone = async () => {
    try {
      const response = await sendGetRequest(
        user.sales_urls[0].Counter_day_smstrigger,
      );
      if (response.status == 'success') {
        setSyncDone(false);
      }
      console.log('onDayDone', response);
    } catch (err) {
      console.log('onDayDone err', err, user.sales_urls[0]);
    }
  };
  return (
    <SafeAreaView style={{flex: 1}}>
      <PortraitDashboard
        onSearch={onSearch}
        onSync={onSync}
        getItemTotal={getItemTotal}
        getItemQty={getItemQty}
        getCartTotal={getCartTotal}
        openNcModal={openNcModal}
        openMulti={openMulti}
        onPaymentSelect={onPaymentSelect}
        enableSante={enableSante}
        cartRefresh={cartRefresh}
        getItemQtyWithCarryBag={getItemQtyWithCarryBag}
        itemsForDiscount={itemsForDiscount}
        newPrintGenerate={newPrintGenerate}
        onDayDone={onDayDone}
        getProductByCat={getProductByCat}
        onNcDone={onNcDone}
        onAccept={onAccept}
        onCounterBillGenerate={onCounterBillGenerate}
        isLoading={isLoading}
        isSante={isSante}
        numColumns={numColumns}
        products={products}
        paymentType={paymentType}
        categories={categories}
        custInfo={custInfo}
        setCustInfo={setCustInfo}
        setNoSyncData={setNoSyncData}
        noSyncdata={noSyncdata}
        syncErr={syncErr}
        setSyncErr={setSyncErr}
        cat_id={cat_id}
        discountModal={discountModal}
        setDiscountModal={setDiscountModal}
        setPaymentType={setPaymentType}
        ncModal={ncModal}
        setNcModal={setNcModal}
        isMultiPayment={isMultiPayment}
        setIsMultiPayment={setIsMultiPayment}
        setNormalCartValues={setNormalCartValues}
        normalCartValues={normalCartValues}
        cartMap={cartMap}
        isPrinting={isPrinting}
      />
    </SafeAreaView>
  );
};

export default Dashboard;
