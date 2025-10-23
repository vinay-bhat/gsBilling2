const {StyleSheet} = require('react-native');
import {fonts} from '../../constants/constants';

export const loginStyles = StyleSheet.create({
  formWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
    maxWidth: 350,
    minHeight: 300,
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
    fontFamily: fonts?.NunitoSansRegular || 'System',
    height: 56,
  },
  loginBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 48,
  },
  loginTxt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts?.NunitoSansBold || 'System',
  },
});
