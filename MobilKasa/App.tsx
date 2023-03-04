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




const Stack = createNativeStackNavigator();

function  App(): JSX.Element {
function goFunc(){
  StackActions.push("NewProduct")
}

  return (
    <NavigationContainer>{/* Rest of your app code */}
    <Stack.Navigator>
        <Stack.Screen name="Main" component={MainScreen} options={{headerShown:false}} ></Stack.Screen>
        <Stack.Screen name="Kasa" component={ShopScreen}></Stack.Screen>
        <Stack.Screen name="Stok" component={StocksScreen} ></Stack.Screen>
        <Stack.Screen name="Order" component={OrderScreen} options={{ title: 'Satışlar' }} ></Stack.Screen>
        <Stack.Screen name="Setting" component={SettingScreen} options={{ title: 'Ayarlar' }}></Stack.Screen>
        <Stack.Screen name="NewProduct" component={NewProduct} options={{ title: 'Yeni Ürün' }} ></Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>   
  );
}
export default App;


