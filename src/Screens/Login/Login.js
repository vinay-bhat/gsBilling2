import {View} from 'react-native';
import React, {useEffect, useState} from 'react';
import PortraitDesign from './PortraitDesign';
import Loader from '../../Components/Loader';
import {sendGetRequest, sendPostRequest} from '../../Utils/ApiMethods';
import useStore from '../../Redux/Store';
import {getInitialData} from '../../Services/API_Helper';
import {setSession} from '../../Utils/AsyncStorageFunctions';
import NetInfo from '@react-native-community/netinfo';
import {isItemPresent} from '../../Utils/sqlite/SqliteFetch';
import SyncModal from '../../Modals/SyncModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {deleteYesterdayDoneCounterBills} from '../../Utils/sqlite/SqliteDelete';

const LOGIN_SKIP_URL_KEYS = new Set([
  'day_closebuttonclick',
  'Counter_day_smstrigger',
  'send_sms',
  'Counter_data_synch',
  'get_billdetails',
]);

const LOGIN_MASTER_SYNC_KEYS = [
  'products',
  'product_catgory',
  'application_settings',
  'outlet_details',
];

export default function Login({navigation}) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [syncErr, setSyncErr] = useState(false);
  const {
    user,
    saveUserData,
    productCategories,
    saveCategories,
    saveProducts,
    productList,
    saveAppSettings,
    saveMastersCreationData,
    setDiscountList,
    setDiscountType,
    setPaymentList,
    setSanteData,
    setSanteDiscountRatio,
    setOutletDetails,
    setUserList,
  } = useStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const onChange = (name, value) => {
    if (name == 'Username') {
      setUserName(value);
    } else {
      setPassword(value);
    }
  };

  const syncInitialUrl = async (key, url, branch) => {
    if (!url || LOGIN_SKIP_URL_KEYS.has(key)) {
      return;
    }
    if (
      typeof url === 'string' &&
      (url.includes('callback') || url.includes('app_data_synching'))
    ) {
      return;
    }
    return getInitialData(
      key,
      url,
      saveCategories,
      saveProducts,
      saveAppSettings,
      saveMastersCreationData,
      setDiscountList,
      setDiscountType,
      isConnected,
      branch,
      setPaymentList,
      setSanteData,
      setSanteDiscountRatio,
      setOutletDetails,
      setUserList,
    );
  };

  const onLogin = async () => {
    console.log('Internet', isConnected);
    if (!isConnected) {
      setSyncErr(true);
      return;
    }
    if (userName !== '' && password !== '') {
      setLoading(true);
      const URL =
        // "https://gspos.in/Testing/index.php/App_controller/login_authenticate";
        // "https://gspos.in/SalesMaster/index.php/App_controller/login_authenticate";
        // main url
        // 'https://gspos.in/SalesMaster/index.php/Counter_billingapp_controller/login_authenticate';

        // 'https://ashtagram.in/Counter-Backend/api/gsbilling/login_authenticate';
        // 'https://gsonlinesolutions.com/Counter-Backend/api/gsbilling/login_authenticate';
        'https://by2coffeestore.com/Counter-Backend/api/gsbilling/login_authenticate';

      // 'https://gspos.in/Testing/index.php/Counter_billingapp_controller/login_authenticate';
      const payload = {
        username: userName,
        password: password,
      };
      try {
        const response = await sendPostRequest(URL, payload);
        console.log('Login Response data:', response);
        if (response.status == 'success') {
          // Delete "Done" records from counter_bills for all dates except today
          try {
            await deleteYesterdayDoneCounterBills();
          } catch (error) {
            console.error(
              'Error deleting counter_bills records (all dates except today):',
              error,
            );
          }

          saveUserData(response);
          console.log(response, 'response123');
          setSession('loginData', response);
          const urls = response.sales_urls[0] || {};
          const branch = response.branch;

          // Sync masters first: products, categories, settings, outlet
          // Each upserts local SQLite and POSTs callback with { data: [ids] }
          for (const key of LOGIN_MASTER_SYNC_KEYS) {
            if (urls[key]) {
              try {
                await syncInitialUrl(key, urls[key], branch);
              } catch (error) {
                console.warn(`⚠️ Master sync failed: ${key}`, error);
              }
            }
          }

          // Sync remaining sales_urls
          const remainingKeys = Object.keys(urls).filter(
            key => !LOGIN_MASTER_SYNC_KEYS.includes(key),
          );
          const results = await Promise.allSettled(
            remainingKeys.map(key => syncInitialUrl(key, urls[key], branch)),
          );
          results.forEach((result, idx) => {
            if (result.status === 'rejected') {
              console.warn(
                `⚠️ API failed: ${remainingKeys[idx]}`,
                result.reason,
              );
            }
          });
          // mark as loaded
          await AsyncStorage.setItem('initialDataLoaded', 'true');
          navigation.replace('Dashboard');
          // getAppSettings(response.sales_urls[0]);
        } else {
          setLoading(false);
        }

        // You can perform additional actions with the data here
      } catch (error) {
        setLoading(false);
        console.error('Error:', error.message);
      }
    }
  };

  return (
    <View style={{flex: 1}}>
      <>
        <SyncModal
          visible={true}
          onClose={() => setSyncErr(false)}
          msg="Please connect to Internet."
        />

        <PortraitDesign
          onSubmit={onLogin}
          onChange={onChange}
          userName={userName}
          password={password}
        />
      </>
      {loading ? <Loader /> : null}
    </View>
  );
}
