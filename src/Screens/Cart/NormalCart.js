import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import React, {useEffect, useState, useMemo} from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import QuantityModal from '../../Modals/QuantityModal';
import DeliveryDateModal from '../../Modals/DeliveryDateModal';
import useStore from '../../Redux/Store';
import {fonts} from '../../constants/constants';

export default function NormalCart({
  paymentList,
  onPaymentSelect,
  paymentType,
  normalCartValues,
  onDeliveryDateChange,
}) {
  const {handleQty} = useStore();

  const cartMap = useStore(s => s.cartMap);

  const cartList = Object.values(cartMap);

  const [isBulk, setIsBulk] = useState(false);
  const [item, setItem] = useState({});
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const CartItem = React.memo(({id}) => {
    const item = useStore(s => s.cartMap[id]);
    const handleQty = useStore(s => s.handleQty);

    if (!item) return null;

    const total = useMemo(() => {
      return (Number(item.basic_rate) * Number(item.qty)).toFixed(2);
    }, [item.basic_rate, item.qty]);

    return (
      <View style={normalCartStyles.cartItemCard}>
        <View style={normalCartStyles.itemRow}>
          {/* Product Section */}
          <View style={normalCartStyles.productSection}>
            <Text style={normalCartStyles.itemName} numberOfLines={2}>
              {item.product_name}
            </Text>
            <Text style={normalCartStyles.itemPrice}>₹{item.basic_rate}</Text>
          </View>

          {/* Qty Section */}
          <View style={normalCartStyles.qtySection}>
            <Pressable
              style={normalCartStyles.qtyButton}
              onPress={() => handleQty('remove', item)}>
              <MaterialCommunityIcons name="minus" size={14} color="#007AFF" />
            </Pressable>

            <TextInput
              style={normalCartStyles.qtyInput}
              value={String(item.qty)}
              onPressIn={() => {
                setIsBulk(true);
                setItem(item);
              }}
            />

            <Pressable
              style={normalCartStyles.qtyButton}
              onPress={() => handleQty('add', item)}>
              <MaterialCommunityIcons name="plus" size={14} color="#007AFF" />
            </Pressable>
          </View>

          {/* Total */}
          <View style={normalCartStyles.totalSection}>
            <Text style={normalCartStyles.itemTotal}>₹{total}</Text>

            <Pressable
              style={normalCartStyles.deleteButton}
              onPress={() => handleQty('delete', item)}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={16}
                color="#FF3B30"
              />
            </Pressable>
          </View>
        </View>
      </View>
    );
  });

  const onQtyEnter = (count, data) => {
    if (data != undefined) {
      handleQty('bulk', data, count);
    }

    setIsBulk(false);
    setItem({});
  };

  const onDateSelect = date => {
    if (date) {
      setDeliveryDate(date);
      if (onDeliveryDateChange) {
        onDeliveryDateChange(date);
      }
    } else {
      setDeliveryDate(null);
      if (onDeliveryDateChange) {
        onDeliveryDateChange(null);
      }
    }
    setShowDatePicker(false);
  };

  const formatDate = date => {
    if (!date) return 'Select Date';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={normalCartStyles.container}>
      <View style={normalCartStyles.headerSection}>
        <Text style={normalCartStyles.headerTitle}>Cart Items</Text>
        <Text style={normalCartStyles.itemCount}>
          {cartList.length} {cartList.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <View style={normalCartStyles.cartListContainer}>
        <FlatList
          data={cartList}
          keyExtractor={(item, index) =>
            item?.pr_id?.toString() || item?.id?.toString() || index.toString()
          }
          renderItem={({item}) => <CartItem id={item.pr_id} />}
          ListEmptyComponent={() => (
            <View style={normalCartStyles.emptyCartContainer}>
              <Text style={normalCartStyles.emptyCartText}>
                No items in cart
              </Text>
            </View>
          )}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          style={{flex: 1, minHeight: 0}}
          bounces={true}
          alwaysBounceVertical={false}
        />
      </View>

      {/* Bottom Section - Summary and Payment */}
      <View style={normalCartStyles.bottomSection}>
        <View style={normalCartStyles.summarySection}>
          <View style={normalCartStyles.summaryRow}>
            <View style={normalCartStyles.summaryItem}>
              <Text style={normalCartStyles.summaryLabel}>Subtotal:</Text>
              <Text style={normalCartStyles.summaryValue}>
                ₹{normalCartValues?.CartTotalBasic || '0.00'}
              </Text>
            </View>

            <View style={normalCartStyles.summaryItem}>
              <Text style={normalCartStyles.summaryLabel}>Tax:</Text>
              <Text style={normalCartStyles.summaryValue}>
                ₹{normalCartValues?.TotalTaxApplied || '0.00'}
              </Text>
            </View>

            <View style={normalCartStyles.summaryItem}>
              <Text style={normalCartStyles.summaryLabel}>Items:</Text>
              <Text style={normalCartStyles.summaryValue}>
                {normalCartValues?.ItemQuantity || 0}
              </Text>
            </View>

            <View style={normalCartStyles.summaryItem}>
              <Text style={normalCartStyles.totalLabel}>Total:</Text>
              <Text style={normalCartStyles.totalValue}>
                ₹{normalCartValues?.CartTotal || '0.00'}
              </Text>
            </View>
          </View>
        </View>

        <View style={normalCartStyles.deliveryDateSection}>
          <Text style={normalCartStyles.deliveryDateTitle}>Delivery Date</Text>
          <Pressable
            style={[
              normalCartStyles.deliveryDateButton,
              cartList.length === 0 &&
                normalCartStyles.deliveryDateButtonDisabled,
            ]}
            disabled={cartList.length === 0}
            onPress={() => setShowDatePicker(true)}>
            <MaterialCommunityIcons
              name="calendar"
              size={18}
              color={cartList.length === 0 ? '#999999' : '#007AFF'}
            />
            <Text
              style={[
                normalCartStyles.deliveryDateText,
                cartList.length === 0 &&
                  normalCartStyles.deliveryDateTextDisabled,
              ]}>
              {deliveryDate ? formatDate(deliveryDate) : 'Select Date'}
            </Text>
            {deliveryDate && (
              <Pressable
                style={normalCartStyles.clearDateButton}
                onPress={e => {
                  e.stopPropagation();
                  setDeliveryDate(null);
                  if (onDeliveryDateChange) {
                    onDeliveryDateChange(null);
                  }
                }}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color="#FF3B30"
                />
              </Pressable>
            )}
          </Pressable>
        </View>

        <View style={normalCartStyles.paymentSection}>
          <Text
            style={[
              normalCartStyles.paymentTitle,
              paymentList.length === 1 && {alignSelf: 'center'},
            ]}>
            Payment Method
          </Text>
          <View style={normalCartStyles.paymentButtons}>
            {paymentList.length > 1 ? (
              paymentList.map(item => {
                const isSelected =
                  paymentType.app_setting_id === item.app_setting_id;

                return (
                  <Pressable
                    key={item.app_setting_id}
                    disabled={cartList.length === 0}
                    onPress={() => onPaymentSelect(item)}
                    style={[
                      normalCartStyles.paymentButton,
                      isSelected && normalCartStyles.paymentButtonSelected,
                      cartList.length === 0 &&
                        normalCartStyles.paymentButtonDisabled,
                    ]}>
                    <Text
                      style={[
                        normalCartStyles.paymentButtonText,
                        isSelected &&
                          normalCartStyles.paymentButtonTextSelected,
                      ]}>
                      {item.setting_name}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <Pressable
                disabled={cartList.length === 0}
                onPress={() => onPaymentSelect(paymentList[0])}
                style={[
                  normalCartStyles.singlePaymentButton,
                  cartList.length === 0 &&
                    normalCartStyles.paymentButtonDisabled,
                ]}>
                <Text style={normalCartStyles.singlePaymentButtonText}>
                  {paymentList[0].setting_name}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {isBulk ? (
        <QuantityModal
          visible={isBulk}
          selectedItem={item}
          onClose={onQtyEnter}
        />
      ) : null}

      <DeliveryDateModal
        visible={showDatePicker}
        selectedDate={deliveryDate}
        onClose={onDateSelect}
      />
    </View>
  );
}

const normalCartStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    borderRadius: 12,
    minHeight: 0,
  },
  bottomSection: {
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
  },
  itemCount: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
  },
  cartListContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    minHeight: 0,
  },
  cartScrollView: {
    flex: 1,
  },
  cartListContent: {
    padding: 8,
    paddingBottom: 16,
  },
  cartItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginVertical: 2,
    marginHorizontal: 8,
    // elevation: 1,
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 1},
    // shadowOpacity: 0.05,
    // shadowRadius: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 6,
    minHeight: 65, // Increased height to accommodate two-line names
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  productSection: {
    flex: 1,
    minWidth: 100,
    maxWidth: '35%',
    alignItems: 'center',
  },
  qtySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 1,
    flex: 0.5,
    justifyContent: 'center',
  },
  totalSection: {
    alignItems: 'center',
    minWidth: 100,
    maxWidth: 120,
    flex: 1.4,
    marginLeft: 8,
    justifyContent: 'center',
    flexDirection: 'column',
    paddingVertical: 4,
  },
  qtyButton: {
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 4,
    minWidth: 22,
  },
  qtyInput: {
    fontSize: 10,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    textAlign: 'center',
    minWidth: 22,
    paddingVertical: 2,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
    minWidth: 100, // Increased to accommodate two-line names
    maxWidth: '45%', // Slightly increased for two-line names
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 13,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    flex: 1,
    marginRight: 8,
    lineHeight: 16,
    minHeight: 32, // Ensure space for two lines
  },
  itemPrice: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
    textAlign: 'center',
  },
  quantitySection: {
    alignItems: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  quantityButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 4,
    minWidth: 24,
  },
  quantityInput: {
    fontSize: 11,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    textAlign: 'center',
    minWidth: 25,
    paddingVertical: 2,
    marginHorizontal: 2,
  },
  itemTotal: {
    fontSize: 11,
    fontFamily: fonts.NunitoSansBold,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 16,
    paddingHorizontal: 4,
  },
  deleteButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
    minWidth: 28,
    minHeight: 28,
    marginLeft: 8,
  },
  summarySection: {
    backgroundColor: '#F5F5F5',
    padding: 6,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexShrink: 0, // Prevent shrinking
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansBold,
    color: '#007AFF',
  },
  deliveryDateSection: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexShrink: 0, // Prevent shrinking
  },
  deliveryDateTitle: {
    paddingVertical: 4,
    fontSize: 14,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    marginBottom: 6,
  },
  deliveryDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    minHeight: 40,
  },
  deliveryDateButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  deliveryDateText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.NunitoSansBold,
    color: '#007AFF',
    marginLeft: 8,
  },
  deliveryDateTextDisabled: {
    color: '#999999',
    fontFamily: fonts.NunitoSansRegular,
  },
  clearDateButton: {
    padding: 4,
    marginLeft: 8,
  },
  paymentSection: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexShrink: 0, // Prevent shrinking
  },
  paymentTitle: {
    paddingVertical: 4,
    fontSize: 14,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    marginBottom: 6,
  },
  paymentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  paymentButton: {
    flex: 1,
    minWidth: 60,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  paymentButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  paymentButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  paymentButtonText: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansRegular,
    color: '#007AFF',
  },
  paymentButtonTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.NunitoSansBold,
  },
  singlePaymentButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: '100%',
  },
  singlePaymentButtonText: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
  },
});
