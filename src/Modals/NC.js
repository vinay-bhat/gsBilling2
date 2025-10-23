import * as React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Text,
} from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const {width} = Dimensions.get('window');

const NCModal = ({
  visible,
  onClose,
  setNcModalData,
  onNcDone,
  ncModalData,
  isPortrait,
}) => {
  const [aprover, setAprover] = React.useState('');
  const [customerName, setCustomerName] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');
  const containerStyle = {
    backgroundColor: 'white',
    padding: 20,
    width: isPortrait ? '80%' : '50%',
    alignSelf: 'center',
    justifyContent: 'center',
    zIndex: 999,
  };
  const countries = ['Staff', 'Guest', 'Others'];
  const approver = ['CEO', 'Manager'];
  const isValidIndianMobileNumber = /^[6-9]\d{9}$/.test(mobileNumber.trim());
  const isAcceptButtonDisabled = !(
    customerName.trim() !== '' &&
    isValidIndianMobileNumber &&
    aprover.trim() !== ''
  );
  const onAccept = () => {
    const obj = {
      nc_cust_name: customerName,
      nc_cust_phone: mobileNumber,
      nc_approved_by: aprover,
    };
    onNcDone(obj);
  };

  const onDismiss = () => {
    const obj = {
      nc_cust_name: '',
      nc_cust_phone: '',
      nc_approved_by: '',
    };
    setNcModalData(obj);

    onClose();
  };

  React.useEffect(() => {
    setCustomerName(ncModalData.nc_cust_name);
    setMobileNumber(ncModalData.nc_cust_phone);
    setAprover(ncModalData.nc_approved_by);
  }, []);
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>NC</Text>
            <TouchableOpacity onPress={onDismiss}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>Customer Name</Text>
            <TextInput
              style={styles.inputs}
              onChangeText={setCustomerName}
              value={customerName}
              placeholder="Enter customer name"
            />

            <Text style={styles.label}>Customer Mobile</Text>
            <TextInput
              style={styles.inputs}
              onChangeText={setMobileNumber}
              value={mobileNumber}
              keyboardType="numeric"
              maxLength={10}
              placeholder="Enter mobile number"
            />

            <Text style={styles.label}>Approved By</Text>
            <SelectDropdown
              data={approver}
              onSelect={(selectedItem, index) => {
                console.log(selectedItem, index);
                setAprover(selectedItem);
              }}
              buttonStyle={styles.inputs}
              defaultValue={aprover}
              buttonTextAfterSelection={(selectedItem, index) => {
                return selectedItem;
              }}
              rowTextForSelection={(item, index) => {
                return item;
              }}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onDismiss}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isAcceptButtonDisabled}
              style={[
                styles.saveButton,
                isAcceptButtonDisabled && styles.disabledButton,
              ]}
              onPress={onAccept}>
              <Text style={styles.saveButtonText}>Accept</Text>
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
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalContent: {
    padding: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  inputs: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: 'black',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 8,
    marginBottom: 4,
  },
});
export default NCModal;
