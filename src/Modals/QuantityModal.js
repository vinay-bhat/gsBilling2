import {View, StyleSheet, TouchableOpacity} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Text, Modal, TextInput} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {fonts} from '../constants/constants';

export default function QuantityModal({visible, onClose, selectedItem}) {
  const [quantity, setQuantity] = useState('1');
  const containerStyle = {
    backgroundColor: '#FFFFFF',
    padding: 24,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  };
  const onDone = () => {
    onClose(quantity, selectedItem);
  };

  useEffect(() => {
    console.log('selectedItem', selectedItem);
    if (selectedItem.qty) {
      setQuantity(selectedItem.qty);
    }
  }, []);
  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={containerStyle}>
      <View style={styles.modalContent}>
        <View style={styles.headerSection}>
          <Text style={styles.modalTitle}>Enter Quantity</Text>
          <Text style={styles.productName}>
            {selectedItem?.product_name || 'Product'}
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Quantity</Text>
          <TextInput
            style={styles.quantityInput}
            keyboardType="numeric"
            onChangeText={count => setQuantity(count)}
            value={quantity.toString()}
            placeholder="Enter quantity"
            placeholderTextColor="#9E9E9E"
          />
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity onPress={onDone} style={styles.doneButton}>
            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
    textAlign: 'center',
  },
  inputSection: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    marginBottom: 8,
  },
  quantityInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    textAlign: 'center',
  },
  buttonSection: {
    width: '100%',
  },
  doneButton: {
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
  doneButtonText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
