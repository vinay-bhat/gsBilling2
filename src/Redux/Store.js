// store.js
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create(
  persist(
    set => ({
      // Complex data types
      user: {},
      productCategories: [],
      productList: [],
      appSettings: [],
      mastersCreationData: [],
      creditCustomerData: [],
      outletDetails: {},
      userList: [],
      discountList: [],
      discountType: '',
      selectedDiscount: 0,
      paymentList: [],
      santeData: [],
      multiPayment: {
        multi_paytm: '0.0',
        multi_card: ' 0.0',
        multi_cash: ' 0.0',
        multi_phonepay: ' 0.0',
      },
      discountDetails: {
        givenBy: '0',
        givenTo: '0',
      },
      ncModalData: {
        nc_cust_name: '0',
        nc_cust_phone: '',
        nc_approved_by: '',
      },
      discountedItemId: [],
      santeDiscountRatio: '3:1',
      tokenNumber: 1,
      isDiscountApplied: false,
      paymentCreds: [],
      dayCLoseButton: false,

      cartMap: {},

      // Functions
      saveUserData: data => set({user: data}),
      saveCategories: categories => set({productCategories: categories}),
      saveProducts: products => set({productList: products}),
      saveAppSettings: settings => set({appSettings: settings}),
      saveMastersCreationData: data => set({mastersCreationData: data}),
      setCreditCustomerData: data => set({creditCustomerData: data}),
      setOutletDetails: outlet => {
        console.log(outlet, 'p0p0p0');
        set({outletDetails: outlet});
      },
      setUserList: list => set({userList: list}),
      setDiscountList: data => set({discountList: data}),
      setDiscountType: type => set({discountType: type}),
      setSelectedDiscount: dis => set({selectedDiscount: dis}),
      setPaymentList: list => set({paymentList: list}),
      setSanteData: data => set({santeData: data}),
      setMultipayment: data => set({multiPayment: data}),
      setDiscountDetails: details => set({discountDetails: details}),
      setNcModalData: data => set({ncModalData: data}),
      setDicountedItemsId: data => set({discountedItemId: data}),
      setSanteDiscountRatio: data => set({santeDiscountRatio: data}),
      setTokenNumber: data => set({tokenNumber: data}),
      setIsDiscountApplied: data => set({isDiscountApplied: data}),
      setPaymentCreds: data => set({paymentCreds: data}),
      setDayCLoseButton: data => set({dayCLoseButton: data}),
      // You can define more states and actions here...

      addToCart: item => {
        set(state => {
          const existing = state.cartMap[item.pr_id];
          return {
            cartMap: {
              ...state.cartMap,
              [item.pr_id]: {
                ...item,
                qty: existing ? existing.qty + 1 : 1,
              },
            },
          };
        });
      },

      handleQty: (type, item, count) => {
        const id = item.pr_id;

        set(state => {
          const prev = state.cartMap;
          const existing = prev[id];

          if (!existing) return {cartMap: prev};

          let newQty = existing.qty;

          if (type === 'delete') {
            const updated = {...prev};
            delete updated[id];
            return {cartMap: updated};
          }

          if (type === 'bulk') {
            if (count == null || count <= 0) newQty = 1;
            else if (count < 99) newQty = count;
          } else if (type === 'remove') {
            newQty = Math.max(existing.qty - 1, 0);
          } else if (type === 'add') {
            newQty = existing.qty + 1;
          }

          if (newQty === 0) {
            const updated = {...prev};
            delete updated[id];
            return {cartMap: updated};
          }

          return {
            cartMap: {
              ...prev,
              [id]: {...existing, qty: newQty},
            },
          };
        });
      },

      clearCart: () => {
        set({cartMap: {}});
      },
      // computed list
      getCartList: () => Object.values(get().cartMap),
    }),
    {
      name: 'app-billing', // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useStore;
