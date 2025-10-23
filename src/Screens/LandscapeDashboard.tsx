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
import { dashboardStyles as styles } from "./DashboardStyle";
import NormalCart from "./Cart/NormalCart";
import SanteCart from "./Cart/SanteCart";
import useStore from "../Redux/Store";
import { sendGetRequest, sendPostRequest } from "../Utils/ApiMethods";
import Loader from "../Components/Loader";
import { useNavigation } from "@react-navigation/native";
import MultiPayment from "../Modals/MultiPayment";
import NoData from "../Components/NoData";
//@ts-ignore
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

const LandscapeDashboard = (props: any) => {
  //   const [cartList, setCartList] = useState([]);
  //   const [discountModal, setDiscountModal] = useState(false);
  //   const [ncModal, setNcModal] = useState(false);
  //   const [isSante, setIsSante] = useState(false);
  //   const [cat_id, setCatId] = useState("");
  //   const [products, setProducts] = useState([]);
  //   const [productsRef, setProductsRef] = useState([]);

  //   const [categories, setCategories] = useState([]);

  //   const [isLoading, setIsLoading] = useState(true);
  //   const [isMultiPayment, setIsMultiPayment] = useState(false);
  //   const [custInfo, setCustInfo] = useState(false);
  //   const [numColumns, setNumColumns] = useState(2);
  //   const [paymentType, setPaymentType] = useState({});
  //   const [noInternet, setNoInternet] = useState(false);
  //   const [syncErr, setSyncErr] = useState(false);
  //   const [discountedItems, setDiscountedItems] = useState([]);
  //   const [syncDone, setSyncDone] = useState(false);
  //   const [noSyncdata, setNoSyncData] = useState(false);

  //   const [groupedItems, setGroupedItems] = useState({});

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
    isDiscountApplied,
    setIsDiscountApplied,
  } = useStore();

  const [dropDown, setDropdown] = useState(false);
  const [dropDownData, setDropdownData] = useState([]);

  const customerFormHandler = async (data: any) => {
    const santheSetting = appSettings.find(
      (setting: any) => setting.setting_name === "CUSTOMER_DETAILS_COLLECTION"
    );
    if (santheSetting) {
      const access = santheSetting.setting_access;

      if (access === 0) {
        setDropdown(false);
        const customerData = {
          name: "",
          mobile: "",
          gstNumber: "",
        };
        props.onCounterBillGenerate(customerData);
        props.setCustInfo(false);
      } else if (access === 1) {
        setDropdown(false);
        props.setCustInfo(data);
      } else if (access === 2) {
        props.setCustInfo(data);
        setDropdown(true);
        try {
          const response = await sendGetRequest(
            user.sales_urls[0].customer_data
          );
          if (response) {
            setDropdownData(response);
          }
        } catch (err) {
          console.log("Counter bill sync error", err);
        }
      } else {
        console.log("Unknown access level");
      }
    } else {
      console.log("CUSTOMER_DETAILS_COLLECTION setting not found.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {props.isLoading ? <Loader /> : null}

      <Header
        onSearch={(string: any) => props.onSearch(string)}
        navigation={navigation}
        onSync={props.onSync}
        isPortrait={false}
      />
      <View
        style={
          props.isSante && props.numColumns == 2
            ? styles.santeMobileWrapper
            : props.isSante && props.numColumns == 4
            ? styles.santeWrapper
            : styles.mainWrapper
        }
      >
        <View
          style={
            props.numColumns == 2
              ? styles.mobileItemListWrapper
              : styles.itemListWrapper
          }
        >
          <View style={{ flexDirection: "column", flex: 1 }}>
            <View style={{ flex: 1 }}>
              {props.products && props.products.length > 0 ? (
                <FlatList
                  data={props.products}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      key={item.pr_id}
                      onPress={() => props.handleAddToCart(item)}
                      style={
                        props.numColumns == 2 ? styles.mobileItem : styles.item
                      }
                    >
                      <Text
                        style={
                          props.numColumns == 2
                            ? styles.mobileTitle
                            : styles.title
                        }
                      >
                        {item.product_name}
                      </Text>
                      {/* <Text style={styles.title}> Rs.{item.price}</Text> */}
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item: any) => item.pr_id}
                  numColumns={props.numColumns}
                  key={props.numColumns.toString()}
                />
              ) : (
                <NoData />
              )}
            </View>
          </View>
        </View>
        <View style={styles.cartWrapper}>
          {props.isSante ? (
            <SanteCart
              cartList={props.cartList}
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
            />
          ) : (
            <NormalCart
              cartList={props.cartList}
              handleQty={props.handleQty}
              selectedDiscount={selectedDiscount}
              openNcModal={props.openNcModal}
              openMulti={props.openMulti}
              paymentList={paymentList}
              onPaymentSelect={props.onPaymentSelect}
              paymentType={props.paymentType}
              isDiscountApplied={isDiscountApplied}
              setIsDiscountApplied={setIsDiscountApplied}
              setNormalCartValues={props.setNormalCartValues}
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
              disabled={props.cartList.length == 0}
              style={
                props.discountModal ? styles.selectedOpt : styles.optionBtn
              }
              onPress={() =>
                props.isSante ? null : props.setDiscountModal(true)
              }
            >
              <Text style={{ color: "#fff", fontSize: 14 }}>Discount</Text>
            </TouchableOpacity>
          ) : null}

          {appSettings &&
          appSettings.length > 0 &&
          isSettingEnabled("SANTHE_MODULE_BUTTON", appSettings) ? (
            <TouchableOpacity
              style={props.isSante ? styles.santeSelected : styles.optionBtn}
              onPress={() => props.enableSante(props.isSante)}
            >
              <MaterialCommunityIcons name="basket" size={25} color="#FFF" />

              <Text style={{ color: "#FFF", fontSize: 14 }}>Sante</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            disabled={props.cartList.length == 0}
            style={{
              ...styles.optionBtn,
              backgroundColor:
                props.cartList.length == 0 ? "#56A2C8" : "#005e9e",
            }}
            onPress={() => props.cartRefresh()}
          >
            <MaterialCommunityIcons name="refresh" size={25} color="#FFF" />

            <Text style={{ color: "#FFF", fontSize: 14 }}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={
              props.cartList.length == 0 ||
              !("setting_name" in props.paymentType) ||
              (props.isSante
                ? props.getItemQtyWithCarryBag % props.itemsForDiscount != 0
                : false)
            }
            onPress={() =>
              props.cartList &&
              props.cartList.length > 0 &&
              "setting_name" in props.paymentType &&
              props.isSante
                ? // ? onGenerate()
                  props.newPrintGenerate()
                : props.cartList &&
                  props.cartList.length > 0 &&
                  "setting_name" in props.paymentType &&
                  !props.isSante
                ? customerFormHandler(true)
                : null
            }
            style={{
              ...styles.optionBtn,
              backgroundColor:
                props.cartList.length == 0 ||
                !("setting_name" in props.paymentType) ||
                (props.isSante
                  ? props.getItemQtyWithCarryBag % props.itemsForDiscount != 0
                  : null)
                  ? "#56A2C8"
                  : "#005e9e",
            }}
          >
            <MaterialCommunityIcons name="printer" size={25} color="#FFF" />

            <Text style={{ color: "#FFF", fontSize: 14 }}>Print</Text>
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
          {props.syncDone ? (
            <TouchableOpacity
              style={styles.optionBtn}
              onPress={() => props.onDayDone()}
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

      {!props.isSante ? (
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              borderTopColor: "black",
              borderTopWidth: 5,
              flexDirection: "row",

              flexGrow: 1,
            }}
          >
            {props.categories &&
            props.categories.length > 0 &&
            !props.isSante ? (
              <FlatList
                horizontal={props.numColumns == 2 ? true : false}
                data={props.categories}
                renderItem={({ item, index }: any) => (
                  <TouchableOpacity
                    activeOpacity={0.5}
                    key={item.pr_cat_code}
                    style={
                      props.cat_id == item.pr_cat_code
                        ? props.numColumns == 2
                          ? styles.mobileCategorySelectedItem
                          : styles.categorySelectedItem
                        : props.numColumns == 2
                        ? styles.mobileCategoryItem
                        : styles.categoryItem
                    }
                    onPress={() => {
                      props.getProductByCat(item.pr_cat_code);
                    }}
                  >
                    <Text style={styles.categoryTitle}>{item.pr_cat_name}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item: any) => item.pr_cat_code}
                key={props.numColumns.toString()}
                numColumns={props.numColumns === 4 ? 6 : undefined}
              />
            ) : null}
          </View>
        </ScrollView>
      ) : null}

      {props.discountModal ? (
        <DiscountModal
          visible={props.discountModal}
          onClose={() => props.setDiscountModal(false)}
          isPortrait={false}
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
          isPortrait={false}
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
          isPortrait={false}
        />
      ) : null}

      {props.custInfo ? (
        <CustomerInfo
          visible={props.custInfo}
          onClose={() => props.setCustInfo(false)}
          onGenerate={props.onCounterBillGenerate}
          isPortrait={false}
          dropDown={dropDown}
          dropDownData={dropDownData}
        />
      ) : null}
      {props.noSyncdata ? (
        <NoDataModal
          visible={props.noSyncdata}
          onClose={() => props.setNoSyncData(false)}
          msg="No bills to sync"
          isPortrait={false}
        />
      ) : null}
      <SyncModal
        visible={props.syncErr}
        onClose={() => props.setSyncErr(false)}
        msg="Please connect to Internet before Sync."
        isPortrait={false}
      />
    </SafeAreaView>
  );
};

export default LandscapeDashboard;
