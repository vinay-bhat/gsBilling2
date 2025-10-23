import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import PaymentService from "../Services/PaymentService";
import ImagePicker from "react-native-image-crop-picker";

import ImageEditor from "@react-native-community/image-editor";

const Razorpay = () => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrType, setQrType] = useState("upi_direct");
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [polling, setPolling] = useState(false);

  const pollingInterval: any = useRef(null);
  const timerInterval: any = useRef(null);

  const [croppedQR, setCroppedQR] = useState<any>(null);

  const cropQRAutomatically = async (imageData: any) => {
    try {
      setLoading(true);

      // Based on your Razorpay QR image, these coordinates should work
      const cropData: any = {
        offset: { x: 110, y: 490 }, // Starting point of QR code
        size: { width: 450, height: 700 }, // QR code dimensions
        displaySize: { width: 300, height: 300 }, // Final output size
        resizeMode: "contain",
      };

      const croppedImageURI = await ImageEditor.cropImage(imageData, cropData);
      console.log(croppedImageURI, "croppedImageURI");

      setCroppedQR(croppedImageURI);
    } catch (err) {
      console.error("Cropping failed:", err);
      Alert.alert("Error", "Failed to extract QR code from image");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) < 1) {
      Alert.alert("Error", "Minimum amount is ₹1");
      return;
    }

    setLoading(true);
    try {
      const response = await PaymentService.createUpiQR(
        parseFloat(amount),
        "INR",
        description || "Payment via QR Code",
        qrType
      );

      console.log("Payment created:", response);
      setPaymentData(response);
      cropQRAutomatically(response.image_url);
      setShowQRModal(true);
      startTimer();
      startPolling(response);
    } catch (error) {
      console.error("Error generating QR code:", error);
      Alert.alert("Error", "Failed to generate QR code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (paymentData: any) => {
    if (polling) return;
    setPolling(true);
    pollingInterval.current = setInterval(() => {
      checkPaymentStatus(paymentData);
    }, 3000); // Poll every 5 seconds
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    setPolling(false);
  };

  const checkPaymentStatus = async (paymentData: any) => {
    console.log("Checking payment status", paymentData);

    if (!paymentData) return;

    try {
      const status = await PaymentService.checkPaymentStatus(paymentData);
      console.log("Payment status:", status);

      if (status.items.length > 0 && status.items[0].status === "captured") {
        setPaymentStatus("success");
        stopPolling();
        stopTimer();
      }
      //   else if (status.payment_status === 'failed') {
      //     setPaymentStatus('failed');
      //     stopPolling();
      //     stopTimer();
      //     Alert.alert(
      //       'Payment Failed',
      //       'The payment could not be processed. Please try again.',
      //     );
      //   }
    } catch (error) {
      console.error("Error checking payment status:", error);
      Alert.alert("Error", "Failed to check payment status. Please try again.");
    }
  };

  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  const startTimer = () => {
    timerInterval.current = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
      if (timeRemaining <= 0) {
        stopPolling();
        stopTimer();
        Alert.alert(
          "Payment Timed Out",
          "The payment did not complete within the allotted time. Please try again."
        );
      }
    }, 1000);
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setPaymentData(null);
    setPaymentStatus("");
    setShowQRModal(false);
  };

  const closeQRModal = () => {
    resetForm();
    setCroppedQR(null);
    PaymentService.cancelPayment(paymentData);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>UPI QR Payment</Text>
        <Text style={styles.subtitle}>
          Generate QR code for direct UPI payments
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amountss (₹) *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount (min ₹1)"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Payment description"
            multiline
            numberOfLines={3}
            maxLength={100}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={generateQRCode}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.buttonText, { marginLeft: 10 }]}>
                Generating...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Generate QR Code</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeQRModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {qrType === "upi_direct"
                  ? "UPI QR Code"
                  : "Razorpay UPI QR Code"}
              </Text>
              {paymentStatus === "success" ? (
                <View style={styles.qrContainer}>
                  <Text>Payment Successful! 🎉</Text>
                </View>
              ) : croppedQR ? (
                <View style={styles.qrContainer}>
                  <Image
                    source={{ uri: croppedQR.uri }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={styles.loadingQR}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  <Text style={styles.loadingText}>Generating QR Code...</Text>
                </View>
              )}

              <View style={styles.paymentDetails}>
                <Text style={styles.amountText}>Amount: ₹{amount}</Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={closeQRModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#2c3e50",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  radioContainer: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#3498db",
    marginRight: 12,
  },
  radioSelected: {
    backgroundColor: "#3498db",
  },
  radioText: {
    fontSize: 16,
    color: "#2c3e50",
  },
  button: {
    backgroundColor: "#3498db",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#3498db",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#2c3e50",
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  qrCode: {
    width: 250,
    height: 250,
    borderRadius: 12,
  },
  qrInstructions: {
    marginTop: 10,
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
  },
  upiButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#27ae60",
    borderRadius: 8,
    minWidth: 150,
  },
  upiButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingQR: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7f8c8d",
  },
  paymentDetails: {
    alignItems: "center",
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  amountText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 5,
  },
  timerText: {
    fontSize: 14,
    color: "#e74c3c",
    fontWeight: "600",
  },
  refText: {
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 5,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusLoader: {
    marginLeft: 10,
  },
  modalButtons: {
    gap: 10,
  },
  checkButton: {
    backgroundColor: "#27ae60",
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
  },
});

export default Razorpay;
