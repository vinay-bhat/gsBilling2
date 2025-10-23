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
import useStore from '../Redux/Store';

const DiscountModal = ({visible, onClose, isPortrait}) => {
  const [discData, setDiscData] = React.useState({
    givenBy: '',
    givenTo: '',
  });
  const [dropList, setDropList] = React.useState([]);
  const [selected, setselected] = React.useState('');

  const {
    discountType,
    mastersCreationData,
    setSelectedDiscount,
    selectedDiscount,
    setDiscountDetails,
    discountDetails,
    setIsDiscountApplied,
  } = useStore();

  React.useEffect(() => {
    console.log('DISCOUNT', discountType);
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
      setSelectedDiscount(0);
    }
  }, []);
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

  const onDiscountSelect = () => {
    setIsDiscountApplied(true);
    setSelectedDiscount(parseInt(selected));
    setDiscountDetails(discData);
    onClose();
  };

  const onDismiss = () => {
    setIsDiscountApplied(false);
    setSelectedDiscount(0);
    setDiscountDetails({
      givenBy: '',
      givenTo: '',
    });
    onClose();
  };
  const onTextChange = (value, name) => {
    const obj = {...discData};
    obj[name] = value;

    setDiscData(obj);
  };
  return (
    <Modal visible={visible} transparent={true} onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={containerStyle}>
          <View style={styles.headerSection}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons
                name="percent"
                size={24}
                color="#007AFF"
              />
              <Text style={styles.modalTitle}>Discount Information</Text>
            </View>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Discount Given By</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.modernInput}
                  onChangeText={val => onTextChange(val, 'givenBy')}
                  value={discData.givenBy}
                  placeholder="Enter name"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Discount Given To</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.modernInput}
                  onChangeText={value => onTextChange(value, 'givenTo')}
                  value={discData.givenTo}
                  placeholder="Enter recipient"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Discount (%)</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="percent"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <SelectDropdown
                  data={dropList ? dropList : []}
                  onSelect={(selectedItem, index) => {
                    setselected(selectedItem);
                  }}
                  defaultValue={selectedDiscount.toString()}
                  buttonStyle={styles.dropdownButton}
                  buttonTextAfterSelection={(selectedItem, index) => {
                    return selectedItem;
                  }}
                  rowTextForSelection={(item, index) => {
                    return item;
                  }}
                  search={true}
                  placeholder="Select discount percentage"
                  placeholderStyle={{
                    fontSize: 16,
                    fontFamily: fonts.NunitoSansRegular,
                    color: '#9E9E9E',
                  }}
                />
              </View>
            </View>
          </View>

          <View style={styles.footerSection}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onDiscountSelect}>
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Apply Discount</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onDismiss}>
              <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
  dropdownButton: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: fonts.NunitoSansRegular,
    color: '#333333',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
  },
  footerSection: {
    padding: 20,
    paddingTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flex: 1,
    marginRight: 8,
    height: 48,
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flex: 1,
    marginLeft: 8,
    height: 48,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
export default DiscountModal;
