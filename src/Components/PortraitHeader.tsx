import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  NativeModules,
  Pressable,
} from 'react-native';
import React, {Component, useEffect, useState} from 'react';
import {DrawerActions} from '@react-navigation/native';
import useStore from '../Redux/Store';
//@ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Searchbar} from 'react-native-paper';
import {removeSession} from '../Utils/AsyncStorageFunctions';
//@ts-ignore
import {tableArray} from '../Utils/sqlite/SqlliteTable';
import {truncateData} from '../Utils/sqlite/SqliteDelete';
import {getDeviceType} from '../Utils/Common';
import {fonts} from '../constants/constants';
const {BillingModule} = NativeModules;

const PortraitHeader = ({onSearch, navigation, setOpenCart}: any) => {
  const [isMobile, setIsMobile] = useState(getDeviceType() === 'Mobile');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  const cartMap = useStore(s => s.cartMap);

  const cartList = Object.values(cartMap);

  const onChangeSearch = (query: any) => {
    setSearchQuery(query);
    onSearch(query);
  };
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format the date
      const dateOptions: any = {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      };
      const formattedDate: any = now.toLocaleDateString(undefined, dateOptions);

      // Format the time
      const timeOptions: any = {hour: 'numeric', minute: 'numeric'};
      const formattedTime: any = now.toLocaleTimeString(undefined, timeOptions);

      // Set the state
      setCurrentDate(formattedDate);
      setCurrentTime(formattedTime);
    };

    // Call the function initially and then every second (1000 milliseconds)
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  const onLogOut = async () => {
    removeSession('loginData');
    for (const table of tableArray) {
      await truncateData(table.tableName);
    }
    navigation.replace('Login');
  };
  return (
    <View style={isMobile ? styles.mobilewrapper : styles.wrapper}>
      <View style={styles.leftSide}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
          <MaterialCommunityIcons name="menu" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search products..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#007AFF"
            placeholderTextColor="#9E9E9E"
          />
        </View>
      </View>
      <View style={styles.rightSide}>
        {/* <Text style={isMobile ? styles.mobiletitle : styles.title}>
          {user && user.branch}
        </Text> */}

        {/* <Text style={isMobile ? styles.mobiletitle : styles.title}>
          {user && user.name}
        </Text> */}
        {/* <TouchableOpacity
          style={{ flexDirection: "row" }}
          onPress={() => setOpenCart(true)}
        >
          <MaterialCommunityIcons name="cart" size={25} color="#005e9e" />
          <Text>{cartList.length}</Text>
        </TouchableOpacity> */}
        <Pressable style={styles.cartButton} onPress={() => setOpenCart(true)}>
          <MaterialCommunityIcons name="cart" size={20} color="#FFFFFF" />
          <Text style={styles.cartButtonText}>Cart</Text>
          {cartList.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartList.length > 99 ? '99+' : cartList.length}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    height: 60,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mobilewrapper: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    height: 75,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  leftSide: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  searchBar: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansRegular,
    color: '#333333',
  },
  menuButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F0F8FF',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    position: 'relative',
  },
  cartButtonText: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.NunitoSansBold,
    textAlign: 'center',
  },
});

export default PortraitHeader;
