import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import React from 'react';
import {Modal} from 'react-native-paper';
import {fonts} from '../constants/constants';

export default function SyncModal({visible, onClose, msg, isPortrait}) {
  const containerStyle = {
    backgroundColor: 'white',
    width: isPortrait ? '85%' : '40%',
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
        <View style={[styles.headerBar, {backgroundColor: '#f44336'}]} />

        {/* Content */}
        <View style={styles.content}>
          <Image
            source={require('../Assets/NoNetwork.png')}
            style={styles.networkImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.message}>
            {msg || 'Please connect to Internet before Sync'}
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.button,
              styles.confirmButton,
              {backgroundColor: '#f44336'},
            ]}>
            <Text style={styles.confirmButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

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
  networkImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.NunitoSansBold,
    color: '#c62828',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansRegular,
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
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
  },
});
