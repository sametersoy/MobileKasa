import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './Screens/MainScreen';
import ShopScreen from './Screens/ShopScreen';
import StocksScreen from './Screens/StocksScreen';
import OrderScreen from './Screens/OrderScreen';
import SettingScreen from './Screens/SettingScreen';


const Stack = createNativeStackNavigator();

function  App(): JSX.Element {
  return (
    <NavigationContainer>{/* Rest of your app code */}
    <Stack.Navigator>
        <Stack.Screen name="Main" component={MainScreen} options={{headerShown:false}} ></Stack.Screen>
        <Stack.Screen name="Kasa" component={ShopScreen} ></Stack.Screen>
        <Stack.Screen name="Stok" component={StocksScreen} ></Stack.Screen>
        <Stack.Screen name="Order" component={OrderScreen} ></Stack.Screen>
        <Stack.Screen name="Setting" component={SettingScreen} ></Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>   
  );
}
export default App;


