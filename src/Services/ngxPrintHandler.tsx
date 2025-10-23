import { NativeModules } from "react-native";
const { NXGBillingModule } = NativeModules;

const sumTotal = (arr: any) =>
  arr.reduce((sum: any, { price, qty }: any) => sum + price * qty, 0);
const sumBasic = (arr: any) =>
  arr.reduce((sum: any, { basic_rate, qty }: any) => sum + basic_rate * qty, 0);

const sumTotalDiscount = (arr: any) =>
  arr.reduce(
    (sum: any, { item_price, item_qty }: any) => sum + item_price * item_qty,
    0
  );
const sumBasicDiscount = (arr: any) =>
  arr.reduce(
    (sum: any, { item_basic, item_qty }: any) => sum + item_basic * item_qty,
    0
  );

const calculateTax = (income: any, taxRate: any) => {
  return income * (taxRate / 100);
};

const sumTax = (arr: any) =>
  arr.reduce(
    (sum: any, { basic_rate, basic_tax_percent, qty }: any) =>
      sum + calculateTax(basic_rate, basic_tax_percent) * qty,
    0
  );

export const santhePrint = async ({
  // State setters
  setIsLoading,
  setCustInfo,
  setCartList,
  setPaymentType,
  setSelectedDiscount,
  setMultipayment,
  setDicountedItemsId,
  enableSante,

  // State values
  cartList,
  paymentType,
  user,
  outletDetails,
  santeDiscountRatio,
  multiPayment,

  // Functions
  getCartTotal2,
  getCurrentDatTime,
  getItemQty,
  getLastValues,
  inserData,
  applyDiscount,
  getSession,
}: any) => {
  setIsLoading(true);
  const { totalAmt, disAmt, finalWithTax, discount } = getCartTotal2();
  const { date, time } = getCurrentDatTime();
  const pattern = /^Carry Bag/;
  let reqObj: any = {};
  let updatedCartWithoutcarryBag = cartList.filter(
    (item: any) => !pattern.test(item.product_name)
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

  var res: any = {};
  sante_discounts.map((e) => {
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
        console.log("inside iddd");
        quantity = cv.qty - e.item_qty;
      }
      console.log(quantity, "quantity");
    });
    return { ...cv, qty: quantity };
  });
  let group_to_values = removedDiscountArray.reduce(function (
    obj: any,
    item: any
  ) {
    obj[item.cgst_tax] = obj[item.cgst_tax] || [];
    obj[item.cgst_tax].push(item.cgst_tax_amount * item.qty);
    return obj;
  },
  {});
  let groups = Object.keys(group_to_values).map(function (key) {
    return {
      cgst: key,
      amount: group_to_values[key].reduce((a: any, b: any) => a + b, 0),
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
    (err: any) => {
      console.log(err, "error message !!!!!!!!!!!!!!!!");
    },
    (msg: any) => {
      console.log(msg, "successs message !!!!!!!!!!!!!!!!");
    }
  );
};

export const onCounterBillGenerate = async ({
  // Input parameter
  custInfo,

  // State values
  cartList,
  paymentType,
  multiPayment,
  user,
  discountDetails,
  ncModalData,
  outletDetails,
  tokenNumber,

  // State setters
  setIsLoading,
  setCustInfo,
  setCartList,
  setPaymentType,
  setSelectedDiscount,
  setMultipayment,
  setGroupedItems,
  setTokenNumber,

  // Functions
  getCurrentDatTime,
  getCartTotal2,
  getLastValues,
  getCurrentFinancialYear,
  getSession,
  inserData,
  transformItem,
  getTotalTaxApplied,
}: any) => {
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
    Object.entries(multiPayment).forEach(([paymentType, amount]: any) => {
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

  const billData: any = {
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

  let Items: any = [];
  let payments: any = [];
  const billId = await inserData("counter_bills", billData);
  if (billId !== null && billId !== undefined) {
    cartList.forEach(async (item: any) => {
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

  let group_to_values = cartList.reduce(function (obj: any, item: any) {
    obj[item.cgst_tax] = obj[item.cgst_tax] || [];
    obj[item.cgst_tax].push(item.cgst_tax_amount * item.qty);
    return obj;
  }, {});
  let groups = Object.keys(group_to_values).map(function (key) {
    return {
      cgst: key,
      amount: group_to_values[key].reduce((a: any, b: any) => a + b, 0),
    };
  });

  // console.log("groups", groups);

  const groupedItemsByToken = cartList.reduce((acc: any, item: any) => {
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

      (err: any) => {
        console.log(err, "error message !!!!!!!!!!!!!!!!");
      },
      (msg: any) => {
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

      (err: any) => {
        console.log(err, "error message !!!!!!!!!!!!!!!!");
      },
      (msg: any) => {
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
