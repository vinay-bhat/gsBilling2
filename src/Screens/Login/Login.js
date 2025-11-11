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
        'https://gspos.in/SalesMaster/index.php/Counter_billingapp_controller/login_authenticate';
      // 'https://gspos.in/Testing/index.php/Counter_billingapp_controller/login_authenticate';
      const payload = {
        username: userName,
        password: password,
      };
      try {
        const response = await sendPostRequest(URL, payload);
        console.log('Login Response data:', response);
        const apiPromises = [];
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
          const urls = response.sales_urls[0];
          for (const key in urls) {
            if (urls.hasOwnProperty(key)) {
              const url = urls[key];
              apiPromises.push(
                await getInitialData(
                  key,
                  url,
                  saveCategories,
                  saveProducts,
                  saveAppSettings,
                  saveMastersCreationData,
                  setDiscountList,
                  setDiscountType,
                  isConnected,
                  response.branch,
                  setPaymentList,
                  setSanteData,
                  setSanteDiscountRatio,
                  setOutletDetails,
                  setUserList,
                ),
              );
            }
          }
          const results = await Promise.allSettled(apiPromises);
          results.forEach((result, idx) => {
            if (result.status === 'rejected') {
              console.warn(
                `⚠️ API failed: ${Object.keys(urls)[idx]}`,
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
    <View>
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
