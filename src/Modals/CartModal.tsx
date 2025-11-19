import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {Portal} from 'react-native-paper';
import NormalCart from '../Screens/Cart/NormalCart';
import SanteCart from '../Screens/Cart/SanteCart';
//@ts-ignore
import Icon from 'react-native-vector-icons/Entypo';
//@ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PaymentService from '../Services/PaymentService';
import ImageEditor from '@react-native-community/image-editor';
//@ts-ignore
import calculateCartValues from '../Services/discountHandler';
import useStore from '../Redux/Store';
import {sendGetRequest} from '../Utils/ApiMethods';
import FastImage from 'react-native-fast-image';
import {fonts} from '../constants/constants';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');
export default function CartModal(props: any) {
  const {paymentCreds} = useStore();

  const cartMap = useStore(s => s.cartMap);

  const cartList = Object.values(cartMap);

  const UPIcontainerStyle: any = {
    backgroundColor: '#FFFFFF',
    width: '95%',
    alignSelf: 'center',
    height: '90%',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
  };

  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrType, setQrType] = useState('upi_direct');
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [polling, setPolling] = useState(false);
  const [croppedQR, setCroppedQR] = useState<any>(null);
  const pollingInterval = useRef<any>(null);
  const timerInterval = useRef<any>(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentCredentials, setPaymentCredentials] = useState<any>([]);

  const [isPrinting, setIsPrinting] = useState(false);
  const isPrintingRef = useRef(false);
  const [, forceUpdate] = useState({});
  const lastClickTime = useRef(0);
  const lockTimeoutRef = useRef<any>(null);
  const DEBOUNCE_DELAY = 2000; // 1 second debounce
  // const [cartValues, setCartValues] = useState<any>({
  //   OriginalTotal: 0,
  //   CartTotalBasic: 0,
  //   TotalDiscountAmount: 0,
  //   TotalTaxApplied: 0,
  //   ItemQuantity: 0,
  //   CartTotal: 0,
  // });

  // useEffect(() => {
  //   let defaultValues;

  //   if (discountType === "DEFAULT_DISCOUNT" && isDiscountApplied) {
  //     defaultValues = calculateCartValues(
  //       props.cartList,
  //       discountType,
  //       0,
  //       isDiscountApplied
  //     );
  //   } else {
  //     defaultValues = calculateCartValues(
  //       props.cartList,
  //       discountType,
  //       selectedDiscount,
  //       isDiscountApplied
  //     );
  //   }
  //   setCartValues(defaultValues);
  //   console.log(defaultValues, "defaultValues");
  // }, [props.cartList, isDiscountApplied, discountType, selectedDiscount]);

  const cropQRAutomatically = async (imageData: any) => {
    try {
      setLoading(true);

      // Based on your Razorpay QR image, these coordinates should work
      const cropData: any = {
        offset: {x: 110, y: 490}, // Starting point of QR code
        size: {width: 450, height: 700}, // QR code dimensions
        displaySize: {width: 300, height: 300}, // Final output size
        resizeMode: 'contain',
      };

      const croppedImageURI = await ImageEditor.cropImage(imageData, cropData);
      console.log(croppedImageURI, 'croppedImageURI');

      setCroppedQR(croppedImageURI);
    } catch (err) {
      console.error('Cropping failed:', err);
      Alert.alert('Error', 'Failed to extract QR code from image');
    } finally {
      setLoading(false);
    }
  };

  const debouncedPrintHandler = (handler: () => void) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;

    console.log('Time since last click:', timeSinceLastClick);
    console.log('isPrintingRef.current:', isPrintingRef.current);

    // Multiple protection layers
    if (isPrintingRef.current) {
      console.log('Print already in progress, ignoring duplicate request');
      return;
    }

    if (timeSinceLastClick < DEBOUNCE_DELAY) {
      console.log('Too soon since last click, ignoring request');
      return;
    }

    // // Clear any existing timeout
    // if (lockTimeoutRef.current) {
    //   clearTimeout(lockTimeoutRef.current);
    // }

    // lastClickTime.current = now;
    // isPrintingRef.current = true;
    // setIsPrinting(true);
    // forceUpdate({});

    // // Set a timeout lock as additional protection
    // lockTimeoutRef.current = setTimeout(() => {
    //   isPrintingRef.current = false;
    //   setIsPrinting(false);
    //   forceUpdate({});
    // }, DEBOUNCE_DELAY);

    handler();
  };

  const generateQRCode = async (
    amount: number,
    description: string,
    qrType: string,
  ) => {
    debouncedPrintHandler(async () => {
      setLoading(true);
      try {
        if (paymentCreds.length > 0) {
          const response = await PaymentService.createUpiQR(
            amount,
            'INR',
            description || 'Payment via QR Code',
            qrType,
            paymentCreds[0]?.customer_id,
            paymentCreds[0]?.key_id,
            paymentCreds[0]?.key_secret,
          );
          console.log('Payment created:', response);
          setPaymentData(response);
          preloadQRCode(response.image_url);
          setCroppedQR(response.image_url);
          // cropQRAutomatically(response.image_url);
          setShowQRModal(true);
          startTimer();
          startPolling(response);
        } else {
          try {
            setLoading(false);
            await props.setCustInfo(true);
          } catch (error) {
            console.error('Print error:', error);
            Alert.alert('Error', 'Failed to print receipt. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        Alert.alert('Error', 'Failed to generate QR code. Please try again.');
      } finally {
        setLoading(false);
        setIsPrinting(false);
        isPrintingRef.current = false;
        forceUpdate({});
      }
    });
  };

  const startPolling = (paymentData: any) => {
    if (polling) return;
    setPolling(true);
    pollingInterval.current = setInterval(() => {
      checkPaymentStatus(paymentData);
    }, 5000); // Poll every 5 seconds
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    setPolling(false);
  };

  const preloadQRCode = (imageUrl: any) => {
    try {
      FastImage.preload([
        {
          uri: imageUrl,
          priority: FastImage.priority.high, // High priority for immediate loading
        },
      ]);
    } catch (error) {
      console.error('Error preloading QR code:', error);
    }
  };

  const checkPaymentStatus = async (paymentData: any) => {
    console.log('Checking payment status', paymentData);
    if (!paymentData) return;
    try {
      const status = await PaymentService.checkPaymentStatus(
        paymentData,
        paymentCreds[0]?.key_id,
        paymentCreds[0]?.key_secret,
      );
      console.log('Payment status:', status);

      if (status.items.length > 0 && status.items[0].status === 'captured') {
        // if (status.items.length === 0) {
        setPaymentStatus('success');
        stopPolling();
        stopTimer();
        props.setCustInfo(true);
        setTimeout(() => {
          closeQRModal(paymentData);
        }, 3000);
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
      console.error('Error checking payment status:', error);
      Alert.alert('Error', 'Failed to check payment status. Please try again.');
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
      setTimeRemaining(prev => prev - 1);
      if (timeRemaining <= 0) {
        stopPolling();
        stopTimer();
        Alert.alert(
          'Payment Timed Out',
          'The payment did not complete within the allotted time. Please try again.',
        );
      }
    }, 1000);
  };

  const closeQRModal = (paymentInfo: any) => {
    console.log(paymentData, 'paymentData');

    setCroppedQR(null);
    // if (getPaymentCreds) {
    //   PaymentService.cancelPayment(
    //     paymentInfo,
    //     getPaymentCreds[0]?.key_id,
    //     getPaymentCreds[0]?.key_secret
    //   );
    // } else {
    PaymentService.cancelPayment(
      paymentInfo,
      paymentCreds[0]?.key_id,
      paymentCreds[0]?.key_secret,
    );
    // }
    setPaymentData(null);
    setPaymentStatus('');
    setShowQRModal(false);

    stopPolling();
    stopTimer();
  };

  const printHandler = async () => {
    debouncedPrintHandler(async () => {
      try {
        await props.newPrintGenerate();
        props.onClose(false);
      } catch (error) {
        console.error('Print error:', error);
        Alert.alert('Error', 'Failed to print receipt. Please try again.');
      } finally {
        setIsPrinting(false);
        isPrintingRef.current = false;
        forceUpdate({});
      }
    });
  };

  const closeCartHandler = () => {
    if (cartList.length === 0) {
      props.setPaymentType({});
      props.setSelectedDiscount(0);
      props.setMultipayment({
        multi_paytm: '0.0',
        multi_card: ' 0.0',
        multi_cash: ' 0.0',
        multi_phonepay: ' 0.0',
      });
      props.onClose(false);
      props.setIsDiscountApplied(false);
    } else {
      props.onClose(false);
    }
  };

  return (
    <>
      {props.visible && (
        <Portal>
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.closeButton}
              onPress={() => closeCartHandler()}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>

            <View style={styles.modalContent}>
              <View style={styles.compactHeaderSection}>
                {props.appSettings &&
                props.appSettings.length > 0 &&
                props.isSettingEnabled('DISCOUNT_BUTTON', props.appSettings) ? (
                  <TouchableOpacity
                    disabled={cartList.length == 0}
                    style={[
                      styles.compactActionButton,
                      props.discountModal && styles.compactActionButtonActive,
                    ]}
                    onPress={() =>
                      props.isSante ? null : props.setDiscountModal(true)
                    }>
                    <MaterialCommunityIcons
                      name="percent"
                      size={16}
                      color={props.discountModal ? '#FFFFFF' : '#007AFF'}
                    />
                    <Text
                      style={[
                        styles.compactActionButtonText,
                        props.discountModal &&
                          styles.compactActionButtonTextActive,
                      ]}>
                      Discount {props.isDiscountApplied ? `Applied` : ''}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <Pressable
                  disabled={cartList.length == 0}
                  style={styles.compactActionButton}
                  onPress={() => props.cartRefresh()}>
                  <MaterialCommunityIcons
                    name="refresh"
                    size={16}
                    color="#FFF"
                  />
                  <Text style={styles.compactActionButtonText}>Refresh</Text>
                </Pressable>
              </View>
              <View style={styles.cartWrapper}>
                <NormalCart
                  paymentList={props.paymentList}
                  onPaymentSelect={props.onPaymentSelect}
                  paymentType={props.paymentType}
                  normalCartValues={props.normalCartValues}
                />
              </View>
              <View style={styles.footerSection}>
                <Pressable
                  disabled={
                    isPrintingRef.current ||
                    isPrinting ||
                    cartList.length == 0 ||
                    !('setting_name' in props.paymentType) ||
                    (props.isSante
                      ? props.getItemQtyWithCarryBag % props.itemsForDiscount !=
                        0
                      : false)
                  }
                  onPress={() =>
                    cartList &&
                    cartList.length > 0 &&
                    'setting_name' in props.paymentType &&
                    props.isSante
                      ? // ? onGenerate()
                        printHandler()
                      : cartList &&
                        cartList.length > 0 &&
                        'setting_name' in props.paymentType &&
                        !props.isSante
                      ? generateQRCode(
                          props.normalCartValues?.CartTotal,
                          'Payment via QR Code',
                          'upi_direct',
                        )
                      : null
                  }
                  style={[
                    styles.printButton,
                    (isPrintingRef.current ||
                      isPrinting ||
                      cartList.length == 0 ||
                      !('setting_name' in props.paymentType) ||
                      (props.isSante
                        ? props.getItemQtyWithCarryBag %
                            props.itemsForDiscount !=
                          0
                        : false)) &&
                      styles.printButtonDisabled,
                  ]}>
                  {isPrintingRef.current || isPrinting ? ( // Show loading state
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="printer"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.printButtonText}>Print Receipt</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Portal>
      )}
      <Modal
        visible={showQRModal}
        transparent={true}
        // onRequestClose={closeQRModal}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.qrHeader}>
                <Text style={styles.qrModalTitle}>
                  {qrType === 'upi_direct'
                    ? 'UPI QR Code'
                    : 'Razorpay UPI QR Code'}
                </Text>
                <TouchableOpacity
                  style={styles.qrCloseButton}
                  onPress={() => closeQRModal(paymentData)}>
                  <MaterialCommunityIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              {paymentStatus === 'success' ? (
                <View style={styles.successContainer}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={64}
                    color="#4CAF50"
                  />
                  <Text style={styles.successText}>Payment Successful! 🎉</Text>
                </View>
              ) : croppedQR ? (
                <View style={styles.qrContainer}>
                  <View style={styles.qrCodeWrapper}>
                    <FastImage
                      style={styles.qrCode}
                      source={{
                        uri: paymentData?.image_url,
                        priority: FastImage.priority.high,
                        // cache: FastImage.cacheControl.immutable,
                      }}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.loadingQR}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Generating QR Code...</Text>
                </View>
              )}
              {paymentStatus === 'success' ? (
                <></>
              ) : (
                <>
                  <View style={styles.paymentDetails}>
                    <Text style={styles.amountText}>
                      Amount: ₹{props.normalCartValues?.CartTotal}
                    </Text>
                  </View>

                  <View style={styles.qrModalButtons}>
                    <TouchableOpacity
                      style={styles.qrCloseButton1}
                      onPress={() => closeQRModal(paymentData)}
                      activeOpacity={0.8}>
                      <Text style={styles.qrButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    zIndex: 10,
    top: 16,
    right: 16,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalContent: {
    height: SCREEN_HEIGHT,
    padding: 10,
    backgroundColor: '#444',
    borderRadius: 12,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99999,
    elevation: 99999,
  },
  compactHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 4,
  },
  compactActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginLeft: 8,
  },
  compactActionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  compactActionButtonText: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansRegular,
    color: '#FFF',
    marginLeft: 4,
  },
  compactActionButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.NunitoSansBold,
  },
  cartWrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 8,
    padding: 5,
    minHeight: 0,
    maxHeight: SCREEN_HEIGHT - 200, // Reserve space for header and footer
  },
  footerSection: {
    alignItems: 'center',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  printButtonDisabled: {
    backgroundColor: '#9E9E9E',
    elevation: 0,
    shadowOpacity: 0,
  },
  printButtonText: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
    marginLeft: 6,
  },

  // QR Modal Styles
  qrModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  qrModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '95%',
    maxHeight: '90%',
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrModalTitle: {
    fontSize: 18,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    flex: 1,
  },
  qrCloseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCloseButton1: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: '40%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successText: {
    fontSize: 18,
    fontFamily: fonts.NunitoSansBold,
    color: '#4CAF50',
    marginTop: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  qrCode: {
    width: 300,
    height: 300,
    borderRadius: 8,
  },
  loadingQR: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
  },
  paymentDetails: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  amountText: {
    fontSize: 18,
    fontFamily: fonts.NunitoSansBold,
    color: '#007AFF',
  },
  qrModalButtons: {
    alignItems: 'center',
  },
  qrButtonText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
  },
});
