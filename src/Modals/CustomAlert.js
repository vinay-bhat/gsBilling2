import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Modal} from 'react-native-paper';

const CustomAlert = ({
  visible,
  onClose,
  title,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
  showCancel = false,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  const getAlertColors = () => {
    switch (type) {
      case 'success':
        return {
          primary: '#4caf50',
          light: '#e8f5e8',
          text: '#2e7d32',
        };
      case 'error':
        return {
          primary: '#f44336',
          light: '#ffebee',
          text: '#c62828',
        };
      case 'warning':
        return {
          primary: '#ff9800',
          light: '#fff3e0',
          text: '#ef6c00',
        };
      default:
        return {
          primary: '#005e9e',
          light: '#e3f2fd',
          text: '#1565c0',
        };
    }
  };

  const colors = getAlertColors();

  const containerStyle = {
    backgroundColor: 'white',
    width: '85%',
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 0,
    maxWidth: 400,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={containerStyle}>
      <View style={styles.container}>
        {/* Header with colored bar */}
        <View style={[styles.headerBar, {backgroundColor: colors.primary}]} />

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, {color: colors.text}]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {showCancel && (
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onConfirm || onClose}
            style={[
              styles.button,
              styles.confirmButton,
              {backgroundColor: colors.primary},
            ]}>
            <Text style={styles.confirmButtonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
  },
  headerBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 0,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlert;
