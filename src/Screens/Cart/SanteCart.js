import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {dashboardStyles as styles} from '../DashboardStyle';
import {applyDiscount, getDeviceType} from '../../Utils/Common';

const CartItem = React.memo(
  ({data, handleQty, getItemsTotalTaxApplied, isMobile}) => (
    <View style={isMobile ? styles.cartMobileItem : styles.cartItem}>
      <Text style={isMobile ? styles.mobilecartItemText : styles.cartItemText}>
        {data.product_name}
      </Text>
      <Text style={isMobile ? styles.mobilecartItemText : styles.cartItemText}>
        {data.basic_rate}
      </Text>
      <View style={styles.qtyRow}>
        <Icon
          name="minus"
          size={30}
          color="#999999"
          onPress={() => handleQty('remove', data)}
        />
        <Text style={styles.qtyText}>{data.qty}</Text>
        <Icon
          name="plus"
          size={30}
          color="#999999"
          onPress={() => handleQty('add', data)}
        />
      </View>
      <Text style={styles.totalTxt}>
        {(Number(data.basic_rate) * Number(data.qty)).toFixed(2)}
      </Text>
      <MaterialCommunityIcons
        name="delete"
        size={30}
        color="#D22B2B"
        onPress={() => handleQty('delete', data)}
      />
    </View>
  ),
);

export default function SanteCart({
  cartList,
  handleQty,
  paymentList,
  paymentType,
  onPaymentSelect,
  selectedDiscount,
  santeDiscountRatio,
}) {
  const [isMobile, setIsMobile] = useState(getDeviceType() === 'Mobile');

  const {discountedCart, totalPrice, discountedItemsId} = useMemo(
    () => applyDiscount(cartList, santeDiscountRatio),
    [cartList, selectedDiscount],
  );
  const dynamicWidth = Math.max(95 / paymentList.length, 18);

  const getItemsTotalTaxApplied = useCallback(
    item => {
      const itemTotal = item.qty * parseInt(item.basic_rate);
      const itemDiscountedTotal =
        itemTotal - (itemTotal * selectedDiscount) / 100;
      const taxPercentage = parseInt(item.basic_tax_percent);
      const taxAmount = (itemDiscountedTotal * taxPercentage) / 100;
      return discountedItemsId.some(dcItem => dcItem === item.pr_id)
        ? taxAmount + 0
        : Number(taxAmount.toFixed(2));
    },
    [discountedCart, selectedDiscount],
  );

  // const getItemQty = useMemo(
  //   () => cartList.reduce((total, item) => total + item.qty, 0),
  //   [cartList]
  // );
  const getItemQty = useMemo(() => {
    const pattern = /^Carry Bag/;
    const updatedCartWithoutCarryBag = cartList.filter(
      item => !pattern.test(item.product_name),
    );

    return updatedCartWithoutCarryBag.reduce(
      (total, item) => total + item.qty,
      0,
    );
  }, [cartList]);

  const getCartTotalBasic = useMemo(() => {
    return discountedCart.reduce(
      (total, item) =>
        total + (item.discounted ? 0 : item.qty * parseFloat(item.basic_rate)),
      0,
    );
  }, [discountedCart]);

  const getTotalTaxApplied = useMemo(() => {
    return discountedCart.reduce((total, item) => {
      if (item.discounted) return total;
      const itemTotal = item.qty * parseInt(item.basic_rate);
      const itemDiscountedTotal =
        itemTotal - (itemTotal * selectedDiscount) / 100;
      const taxPercentage = parseInt(item.basic_tax_percent);
      const taxAmount = (itemDiscountedTotal * taxPercentage) / 100;
      return total + taxAmount;
    }, 0);
  }, [discountedCart, selectedDiscount]);

  const cartTotal = useMemo(() => totalPrice, [totalPrice]);

  const paymentOptionPress = useCallback(
    item => {
      if (getItemQty % 3 === 0) {
        onPaymentSelect(item);
      }
    },
    [getItemQty, onPaymentSelect],
  );
  const itemWidth = `${100 / paymentList.length}`;
  const [itemsForDiscount, discountPerSet] = santeDiscountRatio
    .split(':')
    .map(Number);
  console.log('itemWidth', itemWidth);

  return (
    <View style={{flex: 1, flexDirection: 'column'}}>
      <View style={styles.cartTableHead}>
        <Text style={isMobile ? styles.mobileTableHead : styles.tableHead}>
          Item
        </Text>

        <Text style={isMobile ? styles.mobileTableHead : styles.tableHead}>
          Basic
        </Text>
        {/* <Text style={isMobile?styles.mobileTableHead :styles.tableHead}>Tax</Text> */}
        <Text style={isMobile ? styles.mobileTableHead : styles.tableHead}>
          QTY
        </Text>
        <Text style={isMobile ? styles.mobileTableHead : styles.tableHead}>
          Total
        </Text>
      </View>
      <FlatList
        data={cartList}
        renderItem={({item}) => (
          <CartItem
            data={item}
            handleQty={handleQty}
            getItemsTotalTaxApplied={getItemsTotalTaxApplied}
            isMobile={isMobile}
          />
        )}
        keyExtractor={item => item.pr_id}
      />
      <View
        style={{
          height: isMobile ? 40 : 50,
          flexDirection: 'row',
          backgroundColor: '#D36767',
        }}>
        <Text style={isMobile ? styles.mobileTableHead : styles.tableHead}>
          {getCartTotalBasic.toFixed(2)}
        </Text>
        <Text style={isMobile ? styles.mobileTableHead : styles.tableHead}>
          {getTotalTaxApplied.toFixed(2)}
        </Text>
        <Text style={isMobile ? styles.mobileTableHead : styles.tableHead}>
          {getItemQty}
        </Text>
        <Text style={isMobile ? styles.mobileTableHead : styles.tableHead}>
          {cartTotal.toFixed(0)}
        </Text>
      </View>
      <View
        style={{
          height: isMobile ? 30 : 70,
          padding: isMobile ? 0 : 10,
          flexDirection: 'column',
        }}>
        {/* <FlatList
            contentContainerStyle={{alignContent:'space-between',flexDirection: 'row',width:'100%',flexGrow:1}}
                data={paymentList}
                renderItem={({ item }) => (
                    
                    <TouchableOpacity
                        disabled={cartList.length === 0 || getItemQty % 3 !== 0}
                        onPress={() => paymentOptionPress(item)}
                        style={[
                            paymentType.app_setting_id === item.app_setting_id && getItemQty % 3 === 0
                            ? styles.selectedpayment
                            : isMobile ? styles.paymentMobileOptions : styles.paymentOptions,{width:${itemWidth}%,justifyContent:'center'}
                        ]
                         
                        }
                    >
                        <Text style={paymentType.app_setting_id === item.app_setting_id && getItemQty % 3 === 0 ? styles.selectedBtnTxt : styles.btnText}>
                            {item.setting_name}
                        </Text>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.app_setting_id}
                horizontal
                showsHorizontalScrollIndicator={false}
            /> */}

        <View style={styles.container}>
          {paymentList.map(item => (
            <TouchableOpacity
              key={item.app_setting_id}
              disabled={
                cartList.length === 0 || getItemQty % itemsForDiscount !== 0
              }
              onPress={() => paymentOptionPress(item)}
              style={[
                paymentType.app_setting_id === item.app_setting_id &&
                getItemQty % itemsForDiscount === 0
                  ? isMobile
                    ? styles.selectedMobilepayment
                    : styles.selectedpayment
                  : isMobile
                  ? styles.paymentMobileOptions
                  : styles.paymentOptions,
                {
                  width: `${dynamicWidth}%`, // Apply dynamic width
                },
              ]}>
              <Text
                style={
                  paymentType.app_setting_id === item.app_setting_id &&
                  getItemQty % 3 === 0
                    ? styles.selectedBtnTxt
                    : isMobile
                    ? styles.mobilebtnText
                    : styles.btnText
                }>
                {item.setting_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
