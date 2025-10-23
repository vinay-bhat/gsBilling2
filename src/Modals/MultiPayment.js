import * as React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
} from 'react-native';
import {Text} from 'react-native-paper';
import SelectDropdown from 'react-native-select-dropdown';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {fonts} from '../constants/constants';
import useStore from '../Redux/Store';

const MultiPayment = ({
  visible,
  onClose,
  totalAmt,
  setMultipayment,
  multiPayment,
  isPortrait,
}) => {
  const [multi, setMulti] = React.useState({
    multi_paytm: '0.0',
    multi_card: ' 0.0',
    multi_cash: ' 0.0',
    multi_phonepay: ' 0.0',
  });
  const [dropList, setDropList] = React.useState([]);
  const {discountType, mastersCreationData} = useStore();
  const [balanceAmt, setbalance] = React.useState('0');

  React.useEffect(() => {
    if (
      discountType &&
      discountType !== '' &&
      mastersCreationData &&
      mastersCreationData.length > 0
    ) {
      const list = mastersCreationData.filter(
        dis => dis.masters_status === discountType,
      );

      var newList = [];
      if (list && list.length > 0) {
        list.forEach(data => {
          newList.push(data.master_details);
        });
      }
      setDropList(newList);
    }

    setMulti(multiPayment);
  }, []);
  const containerStyle = {
    backgroundColor: '#FFFFFF',
    width: isPortrait ? '95%' : '50%',
    alignSelf: 'center',
    maxHeight: '85%',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  };

  const getBalance = () => {
    let balance = 0;
    if (totalAmt > 0) {
      balance =
        totalAmt - multi.multi_cash - multi.multi_card - multi.multi_paytm;
    } else {
      balance = 0;
    }
    // setbalance(balance)

    return balance;
  };
  const onChangec = (name, value) => {
    const obj = {...multi};
    obj[name] = value;
    setMulti(obj);
  };

  const onDismiss = () => {
    setMulti({
      multi_paytm: '0.0',
      multi_card: ' 0.0',
      multi_cash: ' 0.0',
      multi_phonepay: ' 0.0',
    });

    onClose();
  };
  const onAccept = () => {
    setMultipayment(multi);
    setMulti({
      multi_paytm: '0.0',
      multi_card: ' 0.0',
      multi_cash: ' 0.0',
      multi_phonepay: ' 0.0',
    });
  };

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={containerStyle}>
          <View style={styles.headerSection}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons
                name="credit-card-multiple"
                size={24}
                color="#007AFF"
              />
              <Text style={styles.modalTitle}>Multi Payment</Text>
            </View>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.contentSection}
            showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bill Amount</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="currency-inr"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.modernInput}
                  value={totalAmt.toString()}
                  editable={false}
                  placeholder="Bill Amount"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cash Payment</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="cash"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.modernInput}
                  onChangeText={value => onChangec('multi_cash', value)}
                  value={multi.multi_cash}
                  keyboardType="numeric"
                  placeholder="Enter cash amount"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Payment</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="credit-card"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.modernInput}
                  onChangeText={value => onChangec('multi_card', value)}
                  value={multi.multi_card}
                  keyboardType="numeric"
                  placeholder="Enter card amount"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Paytm Payment</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="cellphone"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.modernInput}
                  onChangeText={value => onChangec('multi_paytm', value)}
                  value={multi.multi_paytm}
                  keyboardType="numeric"
                  placeholder="Enter Paytm amount"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Balance Amount</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="calculator"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.modernInput}
                  value={getBalance().toString()}
                  editable={false}
                  placeholder="Balance amount"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footerSection}>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                getBalance() !== 0 && styles.acceptButtonDisabled,
              ]}
              disabled={getBalance() !== 0}
              onPress={() => onAccept(multi)}>
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Accept Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    marginLeft: 8,
  },
  closeButton: {
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
  contentSection: {
    height: 700,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  modernInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: fonts.NunitoSansRegular,
    color: '#333333',
    paddingVertical: 0,
  },
  footerSection: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  acceptButtonDisabled: {
    backgroundColor: '#9E9E9E',
    elevation: 0,
    shadowOpacity: 0,
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
export default MultiPayment;
