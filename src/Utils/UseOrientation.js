import {useEffect, useState} from 'react';
import {Dimensions} from 'react-native';

export function useOrientation(){
  const [orientation, setOrientation] = useState("PORTRAIT");

  useEffect(() => {
    Dimensions.addEventListener('change', ({window:{width,height}})=>{
      if (width<height) {
        setOrientation("PORTRAIT")
      } else {
        setOrientation("LANDSCAPE")
    
      }
    })

  }, []);

  return orientation;
}




export const getOrientation=()=>{
let orientation ='PORTRAIT'
Dimensions.addEventListener('change', ({window:{width,height}})=>{
    if (width<height) {
        orientation="PORTRAIT"
    } else {
        orientation ="LANDSCAPE"
  
    }
  })
  return orientation;
}

