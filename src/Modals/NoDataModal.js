import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { Modal } from "react-native-paper";

export default function NoDataModal({ visible, onClose, msg, isPortrait }) {
  const containerStyle = {
    backgroundColor: "white",
    width: isPortrait ? "80%" : "40%",
    alignSelf: "center",
    justifyContent: "center",
    height: "30%",
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={containerStyle}
    >
      <View
        style={{
          alignSelf: "center",
          alignItems: "center",
          alignContent: "center",
        }}
      >
        <Image source={require("../Assets/NoNetwork.png")} />
        <Text style={{ fontSize: isPortrait ? 16 : 25, color: "black" }}>
          {msg}
        </Text>
        <View style={{ height: 50, flexDirection: "row", marginTop: 10 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: "50%",
              backgroundColor: "green",
              marginLeft: 10,
              marginRight: 10,
              borderRadius: 10,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: isPortrait ? 18 : 25,
                color: "white",
                fontWeight: "bold",
              }}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
