import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {Component} from 'react';
import {Card, TextInput} from 'react-native-paper';
import {loginStyles} from './LoginStyle';
import {fonts} from '../../constants/constants';

export default class PortraitDesign extends Component {
  render() {
    const {onSubmit, onChange, userName, password} = this.props;
    return (
      <SafeAreaView>
        <View style={styles.mainWrapper}>
          <View style={styles.form}>
            <View style={{flexDirection: 'row', paddingVertical: 20}}>
              <Image
                style={{height: 50, width: 50}}
                source={require('../../Assets/logo.jpg')}
              />
              <Text
                style={{
                  fontSize: 24,
                  paddingVertical: 10,
                  fontFamily: fonts.NunitoSansBold,
                }}>
                GS Billing
              </Text>
            </View>
            <Card style={loginStyles.formWrapper}>
              <TextInput
                style={loginStyles.inputBox}
                label="Username"
                value={userName}
                mode="outlined"
                onChangeText={value => onChange('Username', value)}
              />
              <TextInput
                style={loginStyles.inputBox}
                label="Password"
                secureTextEntry
                // left={<TextInput.Icon icon="eye" />}
                mode="outlined"
                value={password}
                onChangeText={value => onChange('Password', value)}
              />
              <TouchableOpacity style={loginStyles.loginBtn} onPress={onSubmit}>
                <Text style={loginStyles.loginTxt}>Login</Text>
              </TouchableOpacity>
            </Card>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}
const styles = StyleSheet.create({
  mainWrapper: {
    height: '100%',
    backgroundColor: '#fff',
  },
  image: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
