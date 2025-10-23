export default calculateCartValues = (
  cartItems,
  discountType,
  selectedDiscount = 0,
  applyDiscount = false
) => {
  // Initialize totals
  let originalTotal = 0;
  let cartTotalBasic = 0; // This will now be the total after discount
  let totalDiscountAmount = 0;
  let totalTaxApplied = 0;
  let totalQuantity = 0;
  let cartTotal = 0;

  // Process each item in the cart
  cartItems.forEach((item) => {
    // Extract values from cart item (converting strings to numbers)
    const basicRate = parseFloat(item.basic_rate);
    const quantity = parseFloat(item.qty);

    // Calculate item's original total (before discount)
    const itemOriginalTotal = basicRate * quantity;
    originalTotal += itemOriginalTotal;
    totalQuantity += quantity;

    // Determine discount percentage for this item
    let discountPercentage = 0;
    if (applyDiscount) {
      if (discountType === "DEFAULT_DISCOUNT") {
        discountPercentage = parseFloat(item.discount_perc || 0);
      } else if (
        discountType === "Cat_discount" ||
        discountType === "Flat_discount"
      ) {
        discountPercentage = parseFloat(selectedDiscount);
      }
    }

    // Calculate discount amount
    const itemDiscountAmount = (itemOriginalTotal * discountPercentage) / 100;
    totalDiscountAmount += itemDiscountAmount;

    // Calculate item's basic total (after discount)
    const itemTotalBasic = itemOriginalTotal - itemDiscountAmount;
    cartTotalBasic += itemTotalBasic;

    // Calculate tax on the discounted amount
    let itemTaxAmount = 0;
    if (item.basic_tax_percent) {
      const taxPercent = parseFloat(item.basic_tax_percent);
      itemTaxAmount = (itemTotalBasic * taxPercent) / 100;
    }

    totalTaxApplied += itemTaxAmount;

    // Calculate item total (basic + tax)
    const itemTotal = itemTotalBasic + itemTaxAmount;
    cartTotal += itemTotal;
  });

  // Return all calculated values
  return {
    OriginalTotal: originalTotal.toFixed(2), // Added for reference
    CartTotalBasic: cartTotalBasic.toFixed(2), // Now represents total after discount
    TotalDiscountAmount: totalDiscountAmount.toFixed(2),
    TotalTaxApplied: totalTaxApplied.toFixed(2),
    ItemQuantity: totalQuantity,
    CartTotal: cartTotal.toFixed(0),
  };
};
