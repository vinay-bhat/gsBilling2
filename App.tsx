/**
 * Sample pos system
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useRef, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  NativeModules,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {PaperProvider} from 'react-native-paper';
import 'react-native-gesture-handler';
// navigation imports
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createDrawerNavigator, DrawerItemList} from '@react-navigation/drawer';
import 'react-native-gesture-handler';
import {getSession, removeSession, PRINTER_TYPE_KEY} from './src/Utils/AsyncStorageFunctions';
import {sendGetRequest} from './src/Utils/ApiMethods';
import {tableArray} from './src/Utils/sqlite/SqlliteTable';
import {truncateData} from './src/Utils/sqlite/SqliteDelete';
//@ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {fonts} from './src/constants/constants';
const Drawer = createDrawerNavigator();

import {route, portraitRoute} from './src/Utils/Routes';
import Dashboard from './src/Screens/Dashboard';
import Login from './src/Screens/Login/Login';
import Portrait from './src/Screens/PortraitDashboard';
import {creationSqlliteTable} from './src/Utils/sqlite/Sqlitecreation';
import Splash from './src/Screens/Splash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SynchData from './src/Screens/SynchData';
import BillReport from './src/Screens/BillReport';
import NetInfo from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';

import {onSync, syncCounterBill} from './src/Utils/synch';
import SyncModal from './src/Modals/SyncModal';
import useStore from './src/Redux/Store';
import {initDBQueue} from './src/Utils/queue';
import {isSettingEnabled} from './src/Utils/Common';
import {setPrinterModuleFromType} from './src/Utils/printerModule';

const {NGXBillingModule} = NativeModules;
const {IminWhitelist} = NativeModules;
const {IminiBillingModule} = NativeModules;

import TestScreen from './src/Screens/Login/Test';

// creating stack navigator
const Stack = createStackNavigator();
let db;
function App(): JSX.Element {
  // const navigation = useNavigation();
  const [noInternet, setNoInternet] = useState(false);
  const [syncErr, setSyncErr] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const user = useStore(state => state.user);
  const appSettings = useStore(state => state.appSettings);
  const whitelistRan = useRef(false);

  useEffect(() => {
    creationSqlliteTable();
  }, []);

  async function whitelistApp() {
    try {
      const success = await IminWhitelist.addToWhitelist();
      if (success) {
        console.log('✅ App added to iMin whitelist!');
      } else {
        console.log('⚠️ Failed to add app to whitelist.');
      }
    } catch (err: any) {
      if (err.code === 'NO_PERMISSION') {
        console.warn(
          'Please enable "Modify system settings" permission manually.',
        );
      } else {
        console.error('❌ Error adding to whitelist:', err.message);
      }
    }
  }

  useEffect(() => {
    if (whitelistRan.current) {
      return;
    }

    const resolvePrinterAndWhitelist = async () => {
      let printerName = await AsyncStorage.getItem(PRINTER_TYPE_KEY);

      if (printerName) {
        setPrinterModuleFromType(printerName);
      }

      if (!printerName) {
        const net = await NetInfo.fetch();
        if (!net.isConnected) {
          return;
        }

        let loginData = user;
        if (
          !loginData?.sales_urls?.[0]?.get_printer_details ||
          !loginData?.branch
        ) {
          const session = await getSession('loginData');
          if (!session) {
            return;
          }
          loginData = JSON.parse(session);
        }

        const printerUrl = loginData?.sales_urls?.[0]?.get_printer_details;
        if (!printerUrl || !loginData?.branch) {
          return;
        }

        try {
          const response = await sendGetRequest(
            `${printerUrl}/${loginData.branch}`,
          );
          printerName = response?.[0]?.name ?? null;
          if (printerName) {
            await AsyncStorage.setItem(PRINTER_TYPE_KEY, printerName);
            setPrinterModuleFromType(printerName);
          }
        } catch (_) {
          return;
        }
      }

      whitelistRan.current = true;

      if (printerName === 'Imini') {
        await whitelistApp();
      }
    };

    resolvePrinterAndWhitelist();
  }, [user]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setNoInternet(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // useEffect(() => {
  //   initDBQueue();
  // }, []);

  // useEffect(() => {
  //   IminiBillingModule.initPrewarm();
  // }, []);

  const exportDatabase = async () => {
    const dbPath = '/data/data/com.gsbilling/databases/pos.db';
    const destPath = `${RNFS.DownloadDirectoryPath}/pos_exported.db`;

    try {
      await RNFS.copyFile(dbPath, destPath);
      console.log('Database copied to:', destPath);
    } catch (error) {
      console.error('Error copying DB:', error);
    }
  };

  const DrawerNavigation = () => {
    const navigation = useNavigation();

    const onLogOut = async () => {
      const counterBills = await syncCounterBill(
        'counter_bills',
        'counter_items',
        'counter_payments',
      );
      if (counterBills.length > 0) {
        setIsLoading(true);
        onSync(
          noInternet,
          setSyncErr,
          setIsLoading,
          user,
          setSyncDone,
          (success: boolean, results: any) => {
            console.log('Sync done', success);
            if (success) {
              setIsLoading(false);
              removeSession('loginData');
              AsyncStorage.removeItem('app-store');
              AsyncStorage.removeItem('initialDataLoaded');
              AsyncStorage.removeItem('DB_INSERT_QUEUE');
              // for (const table of tableArray) {
              //   truncateData(table.tableName);
              // }
              navigation.reset({
                index: 0,
                routes: [{name: 'Login' as never}],
              });
            } else {
              setIsLoading(false);
              navigation.reset({
                index: 0,
                routes: [{name: 'Login' as never}],
              });
            }
          },
        );
        return;
      } else {
        removeSession('loginData');
        await AsyncStorage.removeItem('app-store');
        await AsyncStorage.removeItem('initialDataLoaded');
        await AsyncStorage.removeItem('DB_INSERT_QUEUE');
        // for (const table of tableArray) {
        //   await truncateData(table.tableName);
        // }
        navigation.reset({
          index: 0,
          routes: [{name: 'Login' as never}],
        });
      }
    };

    return (
      <Drawer.Navigator
        initialRouteName="Dashboard"
        backBehavior="initialRoute"
        screenOptions={{
          drawerStyle: {
            backgroundColor: '#f9f9f9',
            width: 260,
          },
          drawerActiveTintColor: '#007AFF',
          drawerInactiveTintColor: '#333',
          drawerLabelStyle: {
            fontFamily: fonts.NunitoSansRegular,
            fontSize: 15,
            marginLeft: -15,
          },
        }}
        drawerContent={(props: any) => (
          <CustomSideDrawer {...props} logout={onLogOut} />
        )}>
        <Drawer.Screen
          name="PDashboard"
          component={Dashboard}
          options={{
            drawerLabel: () => <Text style={styles.drawerText}>Billing</Text>,
            drawerIcon: ({color, size}) => (
              <MaterialCommunityIcons
                name="cash-register"
                color={'#73737D'}
                size={size}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="SynchData"
          component={SynchData}
          options={{
            title: 'Synch Data',
            drawerIcon: ({color, size}) => (
              <MaterialCommunityIcons
                name="cloud-sync"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="BillReport"
          component={BillReport}
          options={{
            title: 'Bill Report',
            drawerIcon: ({color, size}) => (
              <MaterialCommunityIcons
                name="file-chart"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Drawer.Navigator>
    );
  };

  const CustomSideDrawer = (props: any) => {
    return (
      <ScrollView style={styles.drawerContainer}>
        {/* Header section */}
        <View style={styles.drawerHeader}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="store" size={32} color="#007AFF" />
          </View>
          <Text style={styles.headerTitle}>POS System</Text>
          <Text style={styles.headerSubtitle}>Smart Billing Solution</Text>
          <View style={styles.headerImageContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={require('./src/Assets/gsLogo.png')}
                style={styles.headerImage}
              />
            </View>
            <Text style={styles.headerLogoSubtitle}>Gravity Soft</Text>
          </View>
          <View style={styles.versionContainer}>
            <TouchableWithoutFeedback onPress={exportDatabase}>
              <Text style={styles.versionText}>Version 1.8</Text>
            </TouchableWithoutFeedback>
          </View>
          {appSettings &&
          appSettings.length > 0 &&
          isSettingEnabled('SANTHE_MODULE_BUTTON', appSettings) ? (
            <View style={styles.santeBadgeContainer}>
              <MaterialCommunityIcons name="leaf" size={16} color="#2E7D32" />
              <Text style={styles.santeBadgeText}>Santhe Billing</Text>
            </View>
          ) : null}
        </View>

        {/* Drawer Items */}
        <View style={styles.drawerList}>
          <DrawerItemList {...props} />
        </View>

        {/* Bottom actions */}
        <View style={styles.drawerFooter}>
          <TouchableWithoutFeedback
            onPress={() => NGXBillingModule.connectprint()}>
            <View style={styles.drawerItem}>
              <MaterialCommunityIcons
                name="printer"
                size={22}
                color="#007AFF"
              />
              <Text style={styles.drawerFooterText}>Connect Printer</Text>
            </View>
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback onPress={props.logout}>
            <View style={styles.drawerItem}>
              <MaterialCommunityIcons name="logout" size={22} color="#F12600" />
              <Text style={[styles.drawerFooterText, {color: '#F12600'}]}>
                Logout
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </ScrollView>
    );
  };

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{animationEnabled: false, headerShown: false}}>
          <Stack.Screen name="Splash" component={Splash} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Dashboard" component={DrawerNavigation} />
          <Stack.Screen name="Portrait" component={Portrait} />
        </Stack.Navigator>

        {/* Sync Progress Modal */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.syncModal}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.syncText}>Sync in Progress</Text>
              <Text style={styles.syncSubText}>
                Please wait while data is being synchronized...
              </Text>
            </View>
          </View>
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  connectPrinter: {
    fontSize: 16,
    color: '#000',
    fontFamily: fonts.NunitoSansRegular,
    marginLeft: 16,
    paddingBottom: 5,
    marginTop: 15,
  },
  profileName: {
    fontSize: 16,
    color: 'rgb(241, 38, 0)',
    fontFamily: fonts.NunitoSansRegular,
    marginLeft: 16,
    paddingBottom: 5,
    marginTop: 15,
  },
  drawerText: {
    color: '#000',
    fontFamily: fonts.NunitoSansRegular,
    fontSize: 16,
    marginLeft: -15,
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  syncModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  syncText: {
    fontSize: 18,
    fontFamily: fonts.NunitoSansBold,
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
  },
  syncSubText: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F0F4F8',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontFamily: fonts.NunitoSansBold,
    fontSize: 24,
    color: '#1A1A1A',
    marginBottom: 5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: fonts.NunitoSansRegular,
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  headerLogoSubtitle: {
    fontFamily: fonts.NunitoSansBold,
    fontSize: 16,
    color: '#1A1A1A',
  },
  drawerList: {
    paddingVertical: 10,
  },
  drawerFooter: {
    marginTop: 30,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingVertical: 15,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  drawerFooterText: {
    fontSize: 15,
    fontFamily: fonts.NunitoSansRegular,
    marginLeft: 15,
    color: '#000',
  },
  headerImage: {
    width: 40,
    height: 40,
  },
  headerImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  versionContainer: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  versionText: {
    fontFamily: fonts.NunitoSansRegular,
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
  },
  headerPattern: {
    position: 'absolute',
    top: 15,
    right: 20,
    flexDirection: 'row',
    gap: 4,
  },
  patternDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    opacity: 0.3,
  },
  santeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  santeBadgeText: {
    fontFamily: fonts.NunitoSansBold,
    fontSize: 13,
    color: '#2E7D32',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
});

export default App;
