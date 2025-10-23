import { View, Text, Image } from 'react-native'
import React from 'react'

export default function NoData() {
  return (
    <View style={{flex:1,justifyContent:'center',alignContent:'center',alignItems:'center'}}>
        <Image  source={require('../Assets/no_data_found.png')} />
        <Text style={{fontSize:25,color:'white',marginTop:5}}>No Data Found</Text>
    </View>
  )
}