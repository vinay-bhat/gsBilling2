import {useEffect, useState} from 'react';
import {View, Image, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {getSession} from '../Utils/AsyncStorageFunctions';
import NetInfo from '@react-native-community/netinfo';
import {getInitialData} from '../Services/API_Helper';
import useStore from '../Redux/Store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fonts} from '../constants/constants';

export default function Splash({navigation}) {
  const [isConnected, setIsConnected] = useState(null);
  const {
    saveUserData,
    productCategories,
    saveCategories,
    saveProducts,
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
    const init = async () => {
      try {
        const response = await getSession('loginData');

        if (!response) {
          navigation.replace('Login');
          return;
        }

        const data = JSON.parse(response);
        saveUserData(data);

        const alreadyLoaded = await AsyncStorage.getItem('initialDataLoaded');

        if (!alreadyLoaded) {
          console.log('📥 First login → preloading API data...');

          const urls = data.sales_urls?.[0] || {};
          const apiPromises = Object.keys(urls).map(key =>
            getInitialData(
              key,
              urls[key],
              saveCategories,
              saveProducts,
              saveAppSettings,
              saveMastersCreationData,
              setDiscountList,
              setDiscountType,
              true, // isNet
              data.branch,
              setPaymentList,
              setSanteData,
              setSanteDiscountRatio,
              setOutletDetails,
              setUserList,
            ),
          );

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
        } else {
          console.log('✅ Skipping preload, already done once');
        }

        navigation.replace('Dashboard');
      } catch (error) {
        console.error('Unexpected error in Splash init:', error);
        navigation.replace('Login');
      }
    };

    init();
  }, [navigation]);
  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require('../Assets/logo.jpg')} />
      <Text
        style={{
          fontSize: 24,
          paddingVertical: 10,
          fontFamily: fonts.NunitoSansBold,
        }}>
        GS Billing
      </Text>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain',
    borderRadius: 10,
  },
});
