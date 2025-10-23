import {
  Text,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  NativeModules,
} from "react-native";
import React, { Component, useEffect, useState } from "react";
import useStore from "../Redux/Store";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Searchbar } from "react-native-paper";
import { removeSession } from "../Utils/AsyncStorageFunctions";
import Icon from "react-native-vector-icons/FontAwesome";
import { tableArray } from "../Utils/sqlite/SqlliteTable";
import { truncateData } from "../Utils/sqlite/SqliteDelete";
import { getDeviceType } from "../Utils/Common";
const { BillingModule } = NativeModules;

const Header = ({ onSearch, navigation, onSync, isPortrait }) => {
  const { user, saveUserData } = useStore();
  const [isMobile, setIsMobile] = useState(getDeviceType() === "Mobile");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    onSearch(query);
  };
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format the date
      const dateOptions = { day: "numeric", month: "numeric", year: "numeric" };
      const formattedDate = now.toLocaleDateString(undefined, dateOptions);

      // Format the time
      const timeOptions = { hour: "numeric", minute: "numeric" };
      const formattedTime = now.toLocaleTimeString(undefined, timeOptions);

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
    removeSession("loginData");
    for (const table of tableArray) {
      await truncateData(table.tableName);
    }
    navigation.replace("Login");
  };
  return (
    <View style={isMobile ? styles.mobilewrapper : styles.wrapper}>
      {/* <View>
        <Image style={{ resizeMode: 'contain', height: 40, width: 40 }} source={require('../Assets/hamburger.jpeg')} />
      </View> */}
      <View style={styles.leftSide}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            margin: 5,
          }}
        >
          <Searchbar
            placeholder="Search"
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={{ width: isPortrait ? "40%" : "90%" }}
          />
        </View>
      </View>
      <View style={styles.rightSide}>
        <TouchableOpacity
          onPress={() => {
            BillingModule.connectprint();
          }}
        >
          <Icon name="print" size={isMobile ? 20 : 30} color="#900" />
        </TouchableOpacity>
        <Text style={isMobile ? styles.mobiletitle : styles.title}>
          {user && user.branch}
        </Text>
        {isPortrait ? null : (
          <Text style={isMobile ? styles.mobiletitle : styles.title}>
            {currentDate} {currentTime}
          </Text>
        )}
        <Text style={isMobile ? styles.mobiletitle : styles.title}>
          {user && user.name}
        </Text>
        <TouchableOpacity onPress={onSync}>
          <Icon name="refresh" size={isMobile ? 20 : 30} color="#900" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            borderColor: "#D22B2B",
            borderWidth: 1,
            height: isMobile ? 30 : 40,
            padding: 5,
            marginStart: 20,
            marginTop: isMobile ? -5 : 0,
          }}
          onPress={() => onLogOut()}
        >
          <MaterialCommunityIcons
            name="logout"
            size={isMobile ? 20 : 30}
            color="#D22B2B"
          />
          <Text style={isMobile ? styles.mobiletitle : styles.title}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "white",

    flexDirection: "row",
    height: 60,
    padding: 10,
  },
  mobilewrapper: {
    backgroundColor: "white",

    flexDirection: "row",
    height: 40,
    padding: 10,
  },
  leftSide: {
    flex: 1,

    flexDirection: "row",
    justifyContent: "space-around",
    paddingRight: 10,
  },
  rightSide: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 2,
  },
  title: {
    fontSize: 20,
    color: "black",
    fontWeight: "600",
  },
  mobiletitle: {
    fontSize: 14,
    color: "black",
    fontWeight: "600",
  },
});

export default Header;
