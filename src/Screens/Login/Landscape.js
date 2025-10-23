import {Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {Component} from 'react';
import {Card, TextInput} from 'react-native-paper';
import { loginStyles } from './LoginStyle';
import SyncModal from '../../Modals/SyncModal';

export default class Landscape extends Component {
  render() {
    const {onSubmit,onChange,userName,password}=this.props
    return (
      <SafeAreaView>
        <View style={styles.mainWrapper}>
          <View style={styles.image}>
            <Image
              style={{height: '100%', width: '100%'}}
              source={require('../../Assets/splash_logo.jpeg')}
            />
          </View>
          <View style={styles.form}>
            <Card style={loginStyles.formWrapper}>
              <TextInput
                style={loginStyles.inputBox}
                label="Username"
    
                value={userName}
                onChangeText={(value)=>onChange("Username",value)}
                mode='outlined'
              />
              <TextInput
                style={loginStyles.inputBox}
                label="Password"
                secureTextEntry
                left={<TextInput.Icon icon="eye" />}
                mode='outlined'
                value={password}
                onChangeText={(value)=>onChange("Password",value)}
                
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
    flexDirection: 'row',
  },
  image: {
    flex: 1,
  
  },
  form: {
    flex: 1,
    backgroundColor: '#1a1c1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formWrapper: {
    height: 400,
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    elevation: 5,
  },
  inputBox:{
    backgroundColor: 'white',fontSize:25,color:'black',margin:20,fontWeight:'500',height:70
  },
  loginBtn:{
    backgroundColor:'#fe9402',
    width:200,
    height:60,
    alignSelf:'center',
    padding:10,
    borderRadius:8,
    justifyContent:'center',marginTop:20
  },
  loginTxt:{
    color:'white',
    textAlign:'center',
    fontSize:25,
    fontWeight:'600'
  }
});
