import { Dimensions } from "react-native";
export const COUNTER_API =
  "https://taazamithai.com/SalesMaster/index.php/Counter_billingapp_controller/get_client_countupdation/TM5";

export const apiUrlMapping = {
  application_count: "application_settings",
  masters_count: "masters_creation",
  creditcustomer_count: "credit_customers",
  outlet_count: "outlet_details",
  category_count: "product_catgory",
  product_count: "products",
  user_count: "users",
};
// export const getCurrentDatTime =()=>{
//   const currentDate = new Date();
//   const date = currentDate.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: '2-digit',
//       day: '2-digit',
//     });
//     const time = currentDate.toLocaleTimeString('en-US', {
//       hour12: false,
//       hour: '2-digit',
//       minute: '2-digit',
//     });

//     return {
//       date:date,
//       time:time
//     }
// }

export const getCurrentDatTime = () => {
  const currentDate = new Date();
  // Format date as yyyy-mm-dd
  const dateISO = currentDate.toISOString().split("T")[0]; // This will give you the yyyy-mm-dd format directly
  const [year, month, day] = dateISO.split("-");
  const date = `${day}-${month}-${year}`;
  // Format time in 12-hour format with AM/PM
  const time = currentDate
    .toLocaleTimeString("en-US", {
      hour12: true, // Use 12-hour format
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/\s(AM|PM)/, "$1");

  return {
    date: date,
    time: time,
    dateISO: dateISO,
  };
};
// item_tax_amt: 0.0, // You may need to adjust this based on your logic
export const transformItem = (item, billId) => {
  const transformedItem = {
    cat_name: item.pr_cat_id,
    product_name: item.product_name,
    hsn_code: item.hsn_code || "0",
    uom: item.uom,
    basic_rate: parseFloat(item.basic_rate) * item.qty,
    tax_percentage: parseFloat(item.basic_tax_percent),
    sgst_tax: parseFloat(item.sgst_tax),
    sgst_base_tax_amt: parseFloat(item.sgst_tax_amount) * item.qty,
    cgst_tax: parseFloat(item.cgst_tax),
    cgst_base_tax_amt: parseFloat(item.cgst_tax_amount) * item.qty,
    basic_price: parseFloat(item.basic_rate) * item.qty,
    pc_qty: parseFloat(item.qty),
    quantity: parseFloat(item.qty),
    price: parseFloat(item.price) * item.qty,
    disc_per: parseFloat(item.discount_perc),
    disc_amount: parseFloat(item.discount_perc),
    item_taxable_amt: parseFloat(item.basic_rate), // Adjust accordingly
    sgst_tax_amount: parseFloat(item.sgst_tax_amount),
    cgst_tax_amount: parseFloat(item.cgst_tax_amount),
    item_tax_amt: item.item_tax_amt,
    total_price: parseFloat(item.price) * item.qty,
    bill_status: "closed", // Set as needed
    sd_status: "running", // Set as needed
    bill_id: billId, // Set as needed
    pr_id: item.pr_id,
    edit_status: 0.0, // Set as needed
    disc_type: "0", // Set as needed
    sales_type: item.sales_item_type,
    product_no: item.product_no || "0",
    Isprinted: 0,
  };
  console.log("item", transformedItem);
  return transformedItem;
};

const calculateDiscountAmount = (
  item,
  applyDiscount,
  discountType,
  selectedDiscount
) => {
  let discountPercentage = 0;
  if (applyDiscount) {
    if (discountType === "DEFAULT_DISCOUNT") {
      discountPercentage = item.discount_perc
        ? parseFloat(item.discount_perc)
        : 0;
    } else if (
      discountType === "Cat_discount" ||
      discountType === "Flat_discount"
    ) {
      discountPercentage = parseFloat(selectedDiscount);
    }
  }
  let discountAmount = parseFloat(
    (
      ((item.basic_rate ?? 0) * (item.qty ?? 0) * (discountPercentage ?? 0)) /
      100
    ).toFixed(2)
  );
  return discountAmount;
};

const calculateItemTaxableAmount = (
  item,
  applyDiscount,
  discountType,
  selectedDiscount
) => {
  let discountPercentage = 0;
  if (applyDiscount) {
    if (discountType === "DEFAULT_DISCOUNT") {
      discountPercentage = item.discount_perc
        ? parseFloat(item.discount_perc)
        : 0;
    } else if (
      discountType === "Cat_discount" ||
      discountType === "Flat_discount"
    ) {
      discountPercentage = parseFloat(selectedDiscount);
    }
  }
  let price = parseFloat(item.basic_rate ?? 0) * (item.qty ?? 0);

  let discountAmount = parseFloat(
    ((price * (discountPercentage ?? 0)) / 100).toFixed(2)
  );

  let itemTaxableAmount = price - discountAmount;

  return itemTaxableAmount;
};

const calculateItemTaxAmt = (
  item,
  applyDiscount,
  discountType,
  selectedDiscount
) => {
  let discountPercentage = 0;
  if (applyDiscount) {
    if (discountType === "DEFAULT_DISCOUNT") {
      discountPercentage = item.discount_perc
        ? parseFloat(item.discount_perc)
        : 0;
    } else if (
      discountType === "Cat_discount" ||
      discountType === "Flat_discount"
    ) {
      discountPercentage = parseFloat(selectedDiscount);
    }
  }

  let price = parseFloat(item.basic_rate ?? 0) * (item.qty ?? 0);

  let discountAmount = parseFloat(
    ((price * (discountPercentage ?? 0)) / 100).toFixed(2)
  );

  let itemTaxableAmount = price - discountAmount;

  let itemTaxAmt = parseFloat(
    ((itemTaxableAmount * (item.basic_tax_percent ?? 0)) / 100).toFixed(2)
  );

  return itemTaxAmt;
};

export const transformItem2 = (
  item,
  billId,
  discountType,
  selectedDiscount,
  applyDiscount
) => {
  const transformedItem = {
    Isprinted: 0,
    sales_type: item.sales_item_type,
    disc_type: "0", // Set as needed
    pr_id: item.pr_id,
    product_no: item.product_no || "0",
    bill_status: "closed", // Set as needed
    hsn_code: item.hsn_code || "0",
    basic_price: parseFloat(item.price),
    tax_percentage: parseFloat(item.basic_tax_percent),
    cgst_tax: parseFloat(item.cgst_tax),
    cgst_base_tax_amt: parseFloat(item.cgst_tax_amount),
    sgst_tax: parseFloat(item.sgst_tax),
    sgst_base_tax_amt: parseFloat(item.sgst_tax_amount),
    basic_rate: parseFloat(item.basic_rate),
    pc_qty: parseFloat(item.qty),
    price: parseFloat(item.basic_rate) * item.qty,
    disc_per: item.discount_perc ? parseFloat(item.discount_perc) : 0,
    disc_amount: calculateDiscountAmount(
      item,
      applyDiscount,
      discountType,
      selectedDiscount
    ),
    item_taxable_amt: calculateItemTaxableAmount(
      item,
      applyDiscount,
      discountType,
      selectedDiscount
    ), // Adjust accordingly
    item_tax_amt: calculateItemTaxAmt(
      item,
      applyDiscount,
      discountType,
      selectedDiscount
    ),
    bill_id: billId, // Set as needed
    sd_status: "running", // Set as needed
    product_name: item.product_name,
    edit_status: 0.0, // Set as needed
    uom: item.uom,
    cat_name: item.pr_cat_id,
    quantity: parseFloat(item.qty),
    sgst_tax_amount: calculateItemTaxAmt(item) / 2,
    cgst_tax_amount: calculateItemTaxAmt(item) / 2,
    total_price: Math.round(
      calculateItemTaxableAmount(item) + calculateItemTaxAmt(item)
    ),
  };
  console.log("item", transformedItem);
  return transformedItem;
};

// discount part
export const applyDiscount = (cart, ratioString) => {
  const [itemsForDiscount, discountPerSet] = ratioString.split(":").map(Number);
  const totalItemCount = cart.reduce((total, item) => total + item.qty, 0);
  const discountQuantity =
    Math.floor(totalItemCount / itemsForDiscount) * discountPerSet;
  const discountedItemsId = [];
  if (discountQuantity > 0 && totalItemCount % itemsForDiscount === 0) {
    // Flatten the cart to individual items based on quantity

    const flattenedCart = cart.reduce((acc, item) => {
      for (let i = 0; i < item.qty; i++) {
        acc.push({ ...item, qty: 1 }); // Create individual items with quantity 1
      }
      return acc;
    }, []);

    // Sort items by price
    const sortedCart = flattenedCart
      .slice()
      .sort((a, b) => a.basic_rate - b.basic_rate);

    // Apply discount to the least priced item
    for (let i = 0; i < discountQuantity; i++) {
      if (sortedCart[i]) {
        sortedCart[i].discounted = true;
        discountedItemsId.push(sortedCart[i].pr_id);
      }
    }

    const totalPrice = sortedCart.reduce((total, item) => {
      const itemTotal = item.qty * parseFloat(item.basic_rate);
      // const itemDiscountedTotal = itemTotal - itemTotal * (selectedDiscount > 0? selectedDiscount/ 100 : parseInt(item.discount_perc)/100);
      const itemDiscountedTotal =
        itemTotal -
        (itemTotal * (item.discount_perc ? parseInt(item.discount_perc) : 0)) /
          100;

      const taxPercentage = parseInt(item.basic_tax_percent); // Get the tax percentage from the item
      const taxAmount = (itemDiscountedTotal * taxPercentage) / 100; // Calculate tax amount based on tax percentage
      item.item_tax_amt = taxAmount.toFixed(2);

      return item.discounted
        ? total + 0
        : total + itemDiscountedTotal + taxAmount; // Add tax amount to the total
    }, 0);

    const totalBasic = sortedCart.reduce(
      (total, item) =>
        item.discounted
          ? total + 0
          : total + item.qty * parseFloat(item.basic_rate),
      0
    );
    const consolidatedCart = sortedCart.reduce((acc, item) => {
      // For discounted items, don't consolidate, add them directly to the accumulator
      if (item.discounted) {
        acc.push({ ...item, qty: item.qty });
      } else {
        // For non-discounted items, check if there's an existing item with the same pr_id
        const found = acc.find((i) => i.pr_id === item.pr_id && !i.discounted);
        if (found) {
          // If found, only consolidate if it's also non-discounted
          found.qty += item.qty;
        } else {
          // If not found or the item is discounted, add it as a new entry
          acc.push({ ...item, qty: item.qty });
        }
      }
      return acc;
    }, []);

    return {
      discountedCart: consolidatedCart.sort((a, b) =>
        a.discounted === b.discounted ? 0 : a.discounted ? 1 : -1
      ),
      totalPrice: Number(totalPrice.toFixed(2)),
      totalBasic: Math.round(totalBasic),
      discountedItemsId: discountedItemsId,
    };
  } else {
    // No discount applied
    const totalPrice = cart.reduce(
      (total, item) => total + item.price * item.qty,
      0
    );

    return {
      discountedCart: cart,
      totalPrice: totalPrice,
      totalBasic: totalPrice,
      discountedItemsId: [],
    };
  }
};

export const getCurrentFinancialYear = () => {
  const today = new Date();
  const currentMonth = today.getMonth(); // Month is zero-based index
  const currentYear = today.getFullYear();

  // Determine the financial year
  const startMonth = 3; // April is month 3 (zero-based index)
  const endMonth = 2; // March is month 2 (zero-based index)

  const financialYearStart =
    currentMonth >= startMonth ? currentYear : currentYear - 1;
  const financialYearEnd = financialYearStart + 1;

  // Convert to the desired format
  const financialYear =
    financialYearStart.toString().substr(2) +
    financialYearEnd.toString().substr(2);

  return financialYear;
};

export const isSettingEnabled = (settingName, details) => {
  // Find the setting object with the given setting name
  const setting = details.find((detail) => detail.setting_name === settingName);
  // If setting is found and setting_access is "1", return true; otherwise, return false
  return setting && setting.setting_access == "1";
};

export const getDeviceType = () => {
  const { width, height } = Dimensions.get("window");
  const threshold = 720; // Threshold width to differentiate between tablet and mobile
  // console.log("deviceType", width,height);
  // Consider a device as a tablet if its width (in portrait) or height (in landscape) is above the threshold
  const isTablet = width >= threshold && height >= threshold;

  return isTablet ? "Tablet" : "Mobile";
};

export const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};
