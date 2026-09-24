import React from 'react';
import { NavigationContainer, StackActions  } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './Screens/MainScreen';
import ShopScreen from './Screens/ShopScreen';
import StocksScreen from './Screens/StocksScreen';
import OrderScreen from './Screens/OrderScreen';
import SettingScreen from './Screens/SettingScreen';
import { Button } from 'react-native';
import NewProduct from './Screens/NewProduct';
import { OrderDetail } from './Screens/OrderDetail';
import {StockDetail} from './Screens/StockDetail';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProductEdit from './Screens/ProductEdit';
import { store } from './Redux/Store'
import { Provider } from 'react-redux'



async function CamSetControl(){
 let CamSetting= await AsyncStorage.getItem('CamSetting');
  if(CamSetting != null){
  console.log('camSetting : '+CamSetting);
  
  }
  else{
    console.log('camSetting else : '+CamSetting);
    AsyncStorage.setItem('CamSetting', 'B');
  }
}
CamSetControl()

async function SoundSetControl(){
  let SoundSetting= await AsyncStorage.getItem('SoundSetting');
   if(SoundSetting != null){
   console.log('SoundSetting : '+SoundSetting);
   
   }
   else{
     console.log('SoundSetControl else : '+SoundSetting);
     AsyncStorage.setItem('SoundSetting', 'A');
   }
 }
 SoundSetControl()

const Stack = createNativeStackNavigator();

function  App(): JSX.Element {

  return (
    <Provider store={store}>
    <NavigationContainer>{/* Rest of your app code */}
    <Stack.Navigator>
        <Stack.Screen name="Main" component={MainScreen} options={{headerShown:false}} ></Stack.Screen>
        <Stack.Screen name="Kasa" component={ShopScreen}></Stack.Screen>
        <Stack.Screen name="Stok" component={StocksScreen} ></Stack.Screen>
        <Stack.Screen name="Order" component={OrderScreen} options={{ title: 'Satışlar' }} ></Stack.Screen>
        <Stack.Screen name="Setting" component={SettingScreen} options={{ title: 'Ayarlar' }}></Stack.Screen>
        <Stack.Screen name="NewProduct" component={NewProduct} options={{ title: 'Yeni Ürün' }} ></Stack.Screen>
        <Stack.Screen name="OrderDetail" component={OrderDetail} options={{ title: 'Satış Detay' }} ></Stack.Screen>
        <Stack.Screen name="StockDetail" component={StockDetail} options={{ title: 'Stok Detay' }} ></Stack.Screen>
        <Stack.Screen name="ProductEdit" component={ProductEdit} options={{ title: 'Ürün Güncelle' }} ></Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>  
    </Provider> 
  );
}
export default App;


