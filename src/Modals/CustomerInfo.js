import * as React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import {Text} from 'react-native-paper';
import SelectDropdown from 'react-native-select-dropdown';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {fonts} from '../constants/constants';

const CustomerInfo = ({
  visible,
  onClose,
  onGenerate,
  isPortrait,
  onCloseCart = () => {},
  dropDown,
  dropDownData,
}) => {
  const [customerName, setCustomerName] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');
  const [gstNumber, setGst] = React.useState('');

  const [selectedCustomer, setSelectedCustomer] = React.useState(null);

  const gstPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isValidIndianMobileNumber = /^[6-9]\d{9}$/.test(mobileNumber.trim());
  // const isAcceptButtonDisabled = !(customerName.trim() !== '' && mobileNumber.trim().length === 10 && (!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)));
  const isAcceptButtonDisabled = !(
    customerName.trim() !== '' &&
    isValidIndianMobileNumber &&
    mobileNumber.trim().length === 10 &&
    (gstNumber.trim() === '' || gstNumber.trim().match(gstPattern))
  );
  const containerStyle = {
    backgroundColor: '#FFFFFF',
    width: isPortrait ? '95%' : '50%',
    alignSelf: 'center',
    height: 'auto',
    maxHeight: '80%',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  };

  const onContinue = () => {
    const data = {
      name: customerName,
      mobile: mobileNumber,
      gstNumber: gstNumber,
    };
    onGenerate(data);
    onClose();
    onCloseCart();
  };
  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={containerStyle}>
          <View style={styles.headerSection}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons
                name="account-circle"
                size={24}
                color="#007AFF"
              />
              <Text style={styles.modalTitle}>Customer Information</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Customer Name</Text>
              {dropDown ? (
                <SelectDropdown
                  data={dropDownData.sort((a, b) =>
                    a.cust_name.localeCompare(b.cust_name),
                  )}
                  onSelect={selectedItem => {
                    setSelectedCustomer(selectedItem);
                    setCustomerName(selectedItem.cust_name);
                    setMobileNumber(selectedItem.cust_phone);
                    setGst(selectedItem.cust_gst);
                  }}
                  search={true}
                  buttonStyle={styles.modernInput}
                  buttonTextAfterSelection={selectedItem =>
                    selectedItem?.cust_name || ''
                  }
                  rowTextForSelection={item => item?.cust_name || ''}
                />
              ) : (
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="account"
                    size={20}
                    color="#666666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.modernInput}
                    onChangeText={setCustomerName}
                    value={customerName}
                    placeholder="Enter customer name"
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="phone"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.modernInput}
                  onChangeText={setMobileNumber}
                  value={mobileNumber}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={dropDown ? false : true}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GST Number (Optional)</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="file-document"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <TextInput
                  autoCapitalize={'characters'}
                  style={styles.modernInput}
                  onChangeText={setGst}
                  value={gstNumber}
                  keyboardType="default"
                  placeholder="Enter GST number"
                  placeholderTextColor="#9E9E9E"
                  maxLength={15}
                  editable={dropDown ? false : true}
                />
              </View>
            </View>
          </View>

          <View style={styles.footerSection}>
            <TouchableOpacity
              style={[
                styles.generateButton,
                isAcceptButtonDisabled && styles.generateButtonDisabled,
              ]}
              onPress={() => {
                if (!isAcceptButtonDisabled) {
                  onContinue();
                }
              }}
              disabled={isAcceptButtonDisabled}>
              <MaterialCommunityIcons
                name="file-document-edit"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.generateButtonText}>Generate Bill</Text>
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
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    paddingTop: 0,
  },
  generateButton: {
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
  generateButtonDisabled: {
    backgroundColor: '#9E9E9E',
    elevation: 0,
    shadowOpacity: 0,
  },
  generateButtonText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default CustomerInfo;
