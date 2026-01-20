import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import Loader from '../Components/Loader';
import useStore from '../Redux/Store';
import {shallow} from 'zustand/shallow';
import NoData from '../Components/NoData';
import {dashboardStyles as styles} from './DashboardStyle';
import {Dimensions} from 'react-native';
import PortraitHeader from '../Components/PortraitHeader';
import {useNavigation} from '@react-navigation/native';
import CartModal from '../Modals/CartModal';
import MultiPayment from '../Modals/MultiPayment';
import SyncModal from '../Modals/SyncModal';
import DiscountModal from '../Modals/Discounts';
import NCModal from '../Modals/NC';
import NoDataModal from '../Modals/NoDataModal';
import CustomerInfo from '../Modals/CustomerInfo';
import {DrawerActions, useFocusEffect} from '@react-navigation/native';
import {
  COUNTER_API,
  apiUrlMapping,
  applyDiscount,
  getCurrentDatTime,
  getCurrentFinancialYear,
  getDeviceType,
  isSettingEnabled,
  transformItem,
} from '../Utils/Common';
//@ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {sendGetRequest, sendPostRequest} from '../Utils/ApiMethods';
import {fonts} from '../constants/constants';

const screenWidth = Dimensions.get('window').width;
const numColumns = 3; // Set dynamically based on your requirement
const itemWidth = (screenWidth - 32 - 36) / numColumns; // Account for container padding (32) and card margins (36)
const FIXED_CATEGORY_WIDTH = 150;

const Portrait = (props: any) => {
  const [numColumns, setNumColumns] = useState(3);
  const [openCart, setOpenCart] = useState(false);
  const [dropDown, setDropdown] = useState(false);
  const [dropDownData, setDropdownData] = useState([]);

  const navigation = useNavigation();

  const {
    user,
    selectedDiscount,
    paymentList,
    setMultipayment,
    multiPayment,
    setSelectedDiscount,
    ncModalData,
    appSettings,
    santeDiscountRatio,
    isDiscountApplied,
    setIsDiscountApplied,
    addToCart,
  } = useStore();

  useFocusEffect(
    useCallback(() => {
      // This will run when the screen comes into focus
      const updateNavigationOptions = () => {
        navigation.setOptions({
          header: () => (
            <PortraitHeader
              onSearch={(string: any) => props.onSearch(string)}
              navigation={navigation}
              setOpenCart={setOpenCart}
            />
          ),
          drawerActiveTintColor: '#fff',
          drawerInactiveTintColor: '#73737D',
          drawerItemStyle: {
            borderRadius: 8,
            marginHorizontal: 8,
          },
          // headerStyle: { backgroundColor: '#f4511e' },
        });
      };

      // Call immediately
      updateNavigationOptions();

      // Also set up a listener for when the component is fully mounted
      // const timeout = setTimeout(updateNavigationOptions, 0);

      // return () => clearTimeout(timeout);
    }, [navigation, props.onSearch, props.onSync]),
  );

  const firstRowCategories: any = [];
  const secondRowCategories: any = [];

  props.categories.forEach((item: any, index: any) => {
    if (index % 2 === 0) {
      firstRowCategories.push(item);
    } else {
      secondRowCategories.push(item);
    }
  });

  const longestRowLength = Math.max(
    firstRowCategories.length,
    secondRowCategories.length,
  );
  const totalContentWidth = longestRowLength * (FIXED_CATEGORY_WIDTH + 10); // Adding 10 for margins

  // Ensure the content is at least as wide as the screen
  const contentMinWidth = Math.max(totalContentWidth, screenWidth);

  const customerFormHandler = async (data: any) => {
    const santheSetting = appSettings.find(
      (setting: any) => setting.setting_name === 'CUSTOMER_DETAILS_COLLECTION',
    );

    if (santheSetting) {
      const access = santheSetting.setting_access;

      if (access === '0' || access === 0) {
        setDropdown(false);
        const customerData = {
          name: '',
          mobile: '',
          gstNumber: '',
        };
        props.onCounterBillGenerate(customerData);
        setOpenCart(false);
        props.setCustInfo(false);
        // setTimeout(() => {
        //   setOpenCart(false);
        //   props.setCustInfo(false);
        // }, 1000);
      } else if (access === '1' || access === 1) {
        setDropdown(false);
        props.setCustInfo(data);
      } else if (access === '2' || access === 2) {
        props.setCustInfo(data);
        setDropdown(true);
        try {
          const response = await sendGetRequest(
            user.sales_urls[0].customer_data,
          );
          if (response) {
            setDropdownData(response);
          }
        } catch (err) {
          console.log('Counter bill sync error', err);
        }
      } else {
        console.log('Unknown access level');
      }
    } else {
      console.log('CUSTOMER_DETAILS_COLLECTION setting not found.');
      setDropdown(false);
      const customerData = {
        name: '',
        mobile: '',
        gstNumber: '',
      };
      props.onCounterBillGenerate(customerData);
      setTimeout(() => {
        setOpenCart(false);
      }, 3000);
    }
  };

  const renderItem = useCallback(({item}: any) => {
    return <ProductCard item={item} onPress={addToCart} />;
  }, []);

  const ProductCard = React.memo(({item, onPress}: any) => {
    const cartItem = useStore(s => s.cartMap[item.pr_id], shallow);

    const isInCart = !!cartItem;

    return (
      <Pressable
        onPress={() => onPress(item)}
        style={[
          portraitStyles.productCard,
          isInCart && portraitStyles.productCardSelected,
        ]}>
        <View style={portraitStyles.productCardContent}>
          <Text
            style={[
              portraitStyles.productName,
              isInCart && portraitStyles.productNameSelected,
            ]}
            numberOfLines={2}
            ellipsizeMode="tail">
            {item.product_name
              .toLowerCase()
              .replace(/\b\w/g, (letter: any) => letter.toUpperCase())}
          </Text>
          {isInCart && (
            <View style={portraitStyles.selectedIndicator}>
              <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
      </Pressable>
    );
  });

  return (
    <SafeAreaView style={portraitStyles.container}>
      {props.isPrinting ? (
        <View style={portraitStyles.loadingContainer}>
          <MaterialCommunityIcons name="printer" size={40} color="#007AFF" />
          <Text style={portraitStyles.loadingText}>Printing...</Text>
        </View>
      ) : (
        <View style={portraitStyles.content}>
          {appSettings &&
          appSettings.length > 0 &&
          isSettingEnabled('SANTHE_MODULE_BUTTON', appSettings) ? (
            <View style={portraitStyles.headerSection}>
              <View style={portraitStyles.santeButtonContainer}>
                <TouchableOpacity
                  style={[
                    portraitStyles.santeButton,
                    props.isSante && portraitStyles.santeButtonActive,
                  ]}
                  onPress={() => props.enableSante(props.isSante)}>
                  <MaterialCommunityIcons
                    name="shopping"
                    size={20}
                    color={props.isSante ? '#FFFFFF' : '#007AFF'}
                  />
                  <Text
                    style={[
                      portraitStyles.santeButtonText,
                      props.isSante && portraitStyles.santeButtonTextActive,
                    ]}>
                    Sante
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={portraitStyles.productsContainer}>
            {props.products && props.products.length > 0 ? (
              <FlatList
                data={props.products}
                renderItem={renderItem}
                keyExtractor={(item: any) => item.pr_id}
                numColumns={numColumns}
                key={numColumns.toString()}
                contentContainerStyle={portraitStyles.productsList}
                showsVerticalScrollIndicator={true}
                columnWrapperStyle={numColumns > 1 ? portraitStyles.row : null}
              />
            ) : (
              <View style={portraitStyles.noDataContainer}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={48}
                  color="#9E9E9E"
                />
                <Text style={portraitStyles.noDataText}>No products found</Text>
              </View>
            )}
          </View>

          <View style={portraitStyles.categoriesSection}>
            {!props.isSante && props.categories.length > 1 ? (
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                style={portraitStyles.categoriesScrollView}
                contentContainerStyle={portraitStyles.categoriesContainer}>
                <View style={portraitStyles.categoriesWrapper}>
                  {/* First Row */}
                  <View style={portraitStyles.categoryRow}>
                    {firstRowCategories.map((item: any) => (
                      <Pressable
                        key={`row1-${item.pr_cat_code}`}
                        style={[
                          portraitStyles.categoryButton,
                          props.cat_id == item.pr_cat_code &&
                            portraitStyles.categoryButtonActive,
                          {width: FIXED_CATEGORY_WIDTH},
                        ]}
                        onPress={() => {
                          props.getProductByCat(item.pr_cat_code);
                        }}>
                        <Text
                          style={[
                            portraitStyles.categoryButtonText,
                            props.cat_id == item.pr_cat_code &&
                              portraitStyles.categoryButtonTextActive,
                          ]}>
                          {item.pr_cat_name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Second Row */}
                  <View style={portraitStyles.categoryRow}>
                    {secondRowCategories.map((item: any) => (
                      <Pressable
                        key={`row2-${item.pr_cat_code}`}
                        style={[
                          portraitStyles.categoryButton,
                          props.cat_id == item.pr_cat_code &&
                            portraitStyles.categoryButtonActive,
                          {width: FIXED_CATEGORY_WIDTH},
                        ]}
                        onPress={() => {
                          props.getProductByCat(item.pr_cat_code);
                        }}>
                        <Text
                          style={[
                            portraitStyles.categoryButtonText,
                            props.cat_id == item.pr_cat_code &&
                              portraitStyles.categoryButtonTextActive,
                          ]}>
                          {item.pr_cat_name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      )}

      <CartModal
        visible={openCart}
        onClose={() => setOpenCart(false)}
        onGenerate={props.onCounterBillGenerate}
        isSante={props.isSante}
        handleQty={props.handleQty}
        getItemTotal={props.getItemTotal}
        getItemQty={props.getItemQty}
        getCartTotal={props.getCartTotal}
        openNcModal={props.openNcModal}
        openMulti={props.openMulti}
        onPaymentSelect={props.onPaymentSelect}
        paymentType={props.paymentType}
        paymentList={paymentList}
        setDiscountedItems={props.setDiscountedItems}
        discountedItems={props.discountedItems}
        selectedDiscount={selectedDiscount}
        santeDiscountRatio={santeDiscountRatio}
        getItemQtyWithCarryBag={props.getItemQtyWithCarryBag}
        itemsForDiscount={props.itemsForDiscount}
        newPrintGenerate={props.newPrintGenerate}
        setCustInfo={customerFormHandler}
        setPaymentType={props.setPaymentType}
        setSelectedDiscount={setSelectedDiscount}
        setMultipayment={setMultipayment}
        appSettings={appSettings}
        isSettingEnabled={isSettingEnabled}
        discountModal={props.discountModal}
        setDiscountModal={props.setDiscountModal}
        isDiscountApplied={isDiscountApplied}
        setIsDiscountApplied={setIsDiscountApplied}
        cartRefresh={props.cartRefresh}
        setNormalCartValues={props.setNormalCartValues}
        normalCartValues={props.normalCartValues}
      />

      {props.discountModal ? (
        <DiscountModal
          visible={props.discountModal}
          onClose={() => props.setDiscountModal(false)}
          isPortrait={true}
        />
      ) : null}

      {props.ncModal ? (
        <NCModal
          visible={props.ncModal}
          onClose={() => {
            props.setNcModal(false);
            props.setPaymentType({});
          }}
          setNcModalData={props.onNcDone}
          onNcDone={props.onNcDone}
          ncModalData={ncModalData}
          isPortrait={true}
        />
      ) : null}

      {props.isMultiPayment ? (
        <MultiPayment
          visible={props.isMultiPayment}
          onClose={() => {
            props.setIsMultiPayment(false);
            props.setPaymentType({});
          }}
          totalAmt={props.normalCartValues?.CartTotal}
          setMultipayment={(data: any) => props.onAccept(data)}
          multiPayment={multiPayment}
          isPortrait={true}
        />
      ) : null}

      {props.custInfo ? (
        <CustomerInfo
          visible={props.custInfo}
          onClose={() => props.setCustInfo(false)}
          onGenerate={props.onCounterBillGenerate}
          isPortrait={true}
          onCloseCart={() => setOpenCart(false)}
          dropDown={dropDown}
          dropDownData={dropDownData}
        />
      ) : null}
      {props.noSyncdata ? (
        <NoDataModal
          visible={props.noSyncdata}
          onClose={() => props.setNoSyncData(false)}
          msg="No bills to sync"
          isPortrait={true}
        />
      ) : null}
      <SyncModal
        visible={props.syncErr}
        onClose={() => props.setSyncErr(false)}
        msg="Please connect to Internet before Sync."
        isPortrait={true}
      />
    </SafeAreaView>
  );
};

const portraitStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  santeButtonContainer: {
    padding: 16,
    alignItems: 'flex-start',
  },
  santeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#FFFFFF',
  },
  santeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  santeButtonText: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansBold,
    color: '#007AFF',
    marginLeft: 8,
  },
  santeButtonTextActive: {
    color: '#FFFFFF',
  },
  productsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productsList: {
    padding: 4,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    margin: 3,
    padding: 8,
    borderWidth: 1,
    borderColor: '#c9c9c9',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: itemWidth,
    height: 70,
    flex: 0,
  },
  productCardSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  productCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: '100%',
  },
  productName: {
    fontSize: 13,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    textAlign: 'center',
    height: 35,
    width: '100%',
    textAlignVertical: 'center',
  },
  productNameSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.NunitoSansBold,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansRegular,
    color: '#9E9E9E',
    marginTop: 12,
  },
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoriesScrollView: {
    backgroundColor: '#FFFFFF',
  },
  categoriesContainer: {
    minWidth: screenWidth - 32,
    padding: 8,
  },
  categoriesWrapper: {
    width: '100%',
  },
  categoryRow: {
    flexDirection: 'row',
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    padding: 8,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 50,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansRegular,
    color: '#007AFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    flex: 1,
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.NunitoSansBold,
  },
});
export default Portrait;
