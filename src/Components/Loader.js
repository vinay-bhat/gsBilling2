import { View, Text } from "react-native";
import React from "react";
import { ActivityIndicator, Dialog, MD2Colors } from "react-native-paper";

export default function Loader() {
  const hideDialog = () => setVisible(false);
  return (
    // <Dialog visible={true} style={{flex:1,justifyContent:'center'}} >
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF80",
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
        justifyContent: "center",
        zIndex:100
      }}
    >
      <ActivityIndicator
        size={"large"}
        animating={true}
        color={MD2Colors.red800}
      />
    </View>

    // </Dialog>
  );
}
