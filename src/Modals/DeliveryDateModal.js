import {View, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Text, Modal} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {fonts} from '../constants/constants';

export default function DeliveryDateModal({visible, onClose, selectedDate}) {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      setDate(new Date(selectedDate));
    } else {
      // Set minimum date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow);
    }
  }, [selectedDate, visible]);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      // Ensure the selected date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);

      if (selected >= today) {
        setDate(selectedDate);
        if (Platform.OS === 'ios') {
          // On iOS, picker stays open, so we don't close it here
        }
      }
    } else if (event.type === 'dismissed') {
      // User dismissed the picker
      setShowPicker(false);
    }
  };

  const onDone = () => {
    // Ensure date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected >= today) {
      onClose(date);
      setShowPicker(false);
    }
  };

  const formatDate = date => {
    if (!date) return 'Select Date';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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

  const minimumDate = new Date();
  minimumDate.setDate(minimumDate.getDate() + 1);

  // On iOS, show picker inline in modal
  if (Platform.OS === 'ios') {
    return (
      <Modal
        visible={visible}
        onDismiss={() => {
          setShowPicker(false);
          onClose(null);
        }}
        contentContainerStyle={containerStyle}>
        <View style={styles.modalContent}>
          <View style={styles.headerSection}>
            <Text style={styles.modalTitle}>Select Delivery Date</Text>
            <Text style={styles.subtitle}>
              Choose a future date for delivery
            </Text>
          </View>

          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              minimumDate={minimumDate}
              style={styles.datePicker}
            />
          </View>

          <View style={styles.selectedDateSection}>
            <Text style={styles.selectedDateLabel}>Selected Date:</Text>
            <Text style={styles.selectedDateText}>{formatDate(date)}</Text>
          </View>

          <View style={styles.buttonSection}>
            <TouchableOpacity
              onPress={() => {
                setShowPicker(false);
                onClose(null);
              }}
              style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDone} style={styles.doneButton}>
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // On Android, show picker as a modal overlay
  return (
    <>
      <Modal
        visible={visible && !showPicker}
        onDismiss={() => onClose(null)}
        contentContainerStyle={containerStyle}>
        <View style={styles.modalContent}>
          <View style={styles.headerSection}>
            <Text style={styles.modalTitle}>Select Delivery Date</Text>
            <Text style={styles.subtitle}>
              Choose a future date for delivery
            </Text>
          </View>

          <View style={styles.dateSection}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker(true)}>
              <MaterialCommunityIcons
                name="calendar"
                size={24}
                color="#007AFF"
              />
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#666666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonSection}>
            <TouchableOpacity
              onPress={() => onClose(null)}
              style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDone} style={styles.doneButton}>
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={minimumDate}
        />
      )}
    </>
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
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
    textAlign: 'center',
  },
  datePickerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
  selectedDateSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  selectedDateLabel: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#007AFF',
  },
  dateSection: {
    width: '100%',
    marginBottom: 24,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    marginLeft: 12,
  },
  buttonSection: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#666666',
  },
  doneButton: {
    flex: 1,
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
