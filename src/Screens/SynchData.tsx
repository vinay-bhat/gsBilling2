import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import {useEffect, useState} from 'react';
import {onSync, syncCounterBill} from '../Utils/synch';

import NetInfo from '@react-native-community/netinfo';
import useStore from '../Redux/Store';
import SyncModal from '../Modals/SyncModal';
import CustomAlert from '../Modals/CustomAlert';
import {useIsFocused} from '@react-navigation/native';
import {sendPostRequest} from '../Utils/ApiMethods';

const SynchData = (props: any) => {
  const [noInternet, setNoInternet] = useState(false);
  const [syncErr, setSyncErr] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [counterBills, setCounterBills] = useState(0);
  const [totalBillAmount, setTotalBillAmount] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    onConfirm: null as (() => void) | null,
  });
  const {user, dayCLoseButton, setDayCLoseButton} = useStore();

  const isFocused = useIsFocused();

  const showAlert = (
    title: string,
    message: string,
    type: string = 'info',
    onConfirm: (() => void) | null = null,
  ) => {
    setAlertConfig({
      title,
      message,
      type,
      onConfirm,
    });
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
    setAlertConfig({
      title: '',
      message: '',
      type: 'info',
      onConfirm: null,
    });
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setNoInternet(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isFocused) {
      async function fetchMyAPI() {
        const counterBills = await syncCounterBill(
          'counter_bills',
          'counter_items',
          'counter_payments',
        );
        setCounterBills(counterBills.length);
        if (counterBills.length > 0 && dayCLoseButton) {
          setDayCLoseButton(false);
        }
        setTotalBillAmount(
          counterBills.reduce(
            (acc: any, bill: any) => acc + bill.total_amount,
            0,
          ),
        );
      }

      fetchMyAPI();
    }
  }, [isFocused]);

  const onSynchHandler = () => {
    setIsLoading(true);
    onSync(
      noInternet,
      setSyncErr,
      setIsLoading,
      user,
      setSyncDone,
      (success: boolean, results: any) => {
        console.log('Sync complete', success, results);
        if (success) {
          setCounterBills(0);
          setDayCLoseButton(true);
          setIsLoading(false);
          showAlert('Complete', 'Sync complete', 'success');
        } else {
          showAlert('Failed', 'Sync failed', 'error');
          setIsLoading(false);
          setDayCLoseButton(false);
        }
      },
    );
  };

  const dayCloseHandler = async () => {
    const response = await sendPostRequest(
      user.sales_urls[0].day_closebuttonclick,
    );
    if (response) {
      showAlert(
        'Success',
        'Day Close successful, \n\nTotal Bill Amount: ' + response.total_sales,
        'success',
      );
      setDayCLoseButton(false);
      setSyncDone(true);
      setSyncErr(false);
    } else {
      showAlert('Failed', 'Day Close failed', 'error');
      setDayCLoseButton(true);
      setSyncDone(false);
      setSyncErr(true);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#005e9e" />
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.header}>
          {counterBills === 0
            ? 'No data to sync'
            : `Pending Bills: ${counterBills}`}
        </Text>
        {/* {counterBills !== 0 && (
          <Text style={styles.totalBillAmount}>
            Total Bill Amount:{' '}
            <Text style={styles.totalBillAmountValue}>
              {totalBillAmount.toFixed(2)}
            </Text>
          </Text>
        )} */}
        {syncErr && <Text style={styles.errorText}>Sync Error</Text>}
        <TouchableOpacity
          disabled={counterBills === 0 || isLoading}
          onPress={onSynchHandler}
          style={[
            styles.syncButton,
            (counterBills === 0 || isLoading) && styles.syncButtonDisabled,
          ]}>
          <Text style={styles.syncButtonText}>Synch</Text>
        </TouchableOpacity>
        {dayCLoseButton && (
          <TouchableOpacity
            onPress={dayCloseHandler}
            disabled={counterBills !== 0}
            style={[
              styles.dayCloseButton,
              (counterBills !== 0 || isLoading) && styles.syncButtonDisabled,
            ]}>
            <Text style={styles.syncButtonText}>Day Close</Text>
          </TouchableOpacity>
        )}
      </View>
      <SyncModal
        visible={syncErr}
        onClose={() => setSyncErr(false)}
        msg="Please connect to Internet before Sync."
        isPortrait={true}
      />
      <CustomAlert
        visible={alertVisible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6fa',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  card: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 400,
  },
  inputContainer: {
    // No longer used, replaced by card
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#005e9e',
  },
  totalBillAmount: {
    fontSize: 17,
    marginBottom: 20,
    textAlign: 'center',
    color: '#444',
  },
  totalBillAmountValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#444',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  syncButton: {
    backgroundColor: '#005e9e',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#005e9e',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCloseButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#d32f2f',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  syncButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default SynchData;
