import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './Screens/MainScreen';
import ShopScreen from './Screens/ShopScreen';

const Stack = createNativeStackNavigator();

function  App(): JSX.Element {
  return (
    <NavigationContainer>{/* Rest of your app code */}
    <Stack.Navigator>
        <Stack.Screen name="Main" component={MainScreen} options={{headerShown:false}} ></Stack.Screen>
        <Stack.Screen name="Kasa" component={ShopScreen} ></Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>

   
  );
}
export default App;


