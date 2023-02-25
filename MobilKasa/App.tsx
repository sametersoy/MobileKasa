import React, { useState, useRef } from 'react';
import type { PropsWithChildren } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Button,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TrackPlayer from 'react-native-track-player';
import { RNCamera } from 'react-native-camera';
import { CallMusicStart } from './Components/TrackPlayer';
import {GetProduct} from './Services/GetProduct';
import LogoTitle from './Components/LogoTitle';
import MainScreen from './Screens/MainScreen';



const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
TrackPlayer.setupPlayer();



export interface Barcode {

  data: string;
  dataRaw: string;
  format?: string;
  addresses?: {
    addressesType?: 'UNKNOWN' | 'Work' | 'Home';
    addressLines?: string[];
  }[];

  urls?: string[];
  name?: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    prefix?: string;
    pronounciation?: string;
    suffix?: string;
    formattedName?: string;
  };
  organization?: string;
  latitude?: number;
  longitude?: number;
  ssid?: string;
  password?: string;
  encryptionType?: string;
  title?: string;
  url?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  addressCity?: string;
  addressState?: string;
  addressStreet?: string;
  addressZip?: string;
  birthDate?: string;
  documentType?: string;
  licenseNumber?: string;
  expiryDate?: string;
  issuingDate?: string;
  issuingCountry?: string;
  eventDescription?: string;
  location?: string;
  organizer?: string;
  status?: string;
  summary?: string;
  start?: string;
  end?: string;
  phoneNumber?: string;
  message?: string;
}
function request<TResponse>(
  url: string,
  // `RequestInit` is a type for configuring 
  // a `fetch` request. By default, an empty object.
  config: RequestInit = {}

  // This function is async, it will return a Promise:
): Promise<TResponse> {

  // Inside, we call the `fetch` function with 
  // a URL and config given:
  return fetch(url, config)
    // When got a response call a `json` method on it
    .then((response) => {
      response.json()
      console.log(response.json())
    })
    // and return the result data.
    .then((data) => data as TResponse);

  // We also can use some post-response
  // data-transformations in the last `then` clause.
}
export interface IProduct {
  id: string;
  barcode: string;
  product_name: string;
  price: string;
  stock: string;

}

const Products = [
  {

  },

];
const Stack = createNativeStackNavigator();

function  App(): JSX.Element {


  let nettoplam: number = 0.0;

  function toplamHesapla(datas:any[]) {
    console.log('Toplam Hesapla : '+datas);
    datas.forEach((element,index)  => {
      //console.log(nettoplam + parseFloat(element.price));
      nettoplam=nettoplam + parseFloat(element.price)
      console.log(nettoplam)
      if (!element.id){
        console.log("Undefined element: " + index);
        datas.splice(index, 1);
      }
      if(nettoplam == 0.0){
      nettoplam=parseFloat(element.price)
      }
      setToplam(nettoplam);
    });

  }
  async function servis(barcode: string): Promise<void> {
    CallMusicStart();
    GetProduct(barcode).then((data) => {
      datas.push({ id: data.id, barcode: data.barcode, product_name: data.product_name, stock: data.stock, price: data.price });
      setDatas(datas)
      toplamHesapla(datas);
    }).catch((error) => {
      console.log("error");
      setProduct_name("Ürün Bulunamadı.");
      setPrice("Fiyat Bulunamadı")
      setStock("Stok Bulunamadı")
      console.error(error);
    });
  }
  const [type, setType] = useState(RNCamera.Constants.Type.back);
  const cameraref = useRef(null);

  const [barcode, setBarcode] = useState("");
  const [toplam, setToplam] = useState(0.0);
  const [product_name, setProduct_name] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [datas, setDatas] = useState(Products)
  const [isRendered, setIsRendered] = useState(false);
  function ReadedBarcode(okunan: Barcode): string {
    if (okunan) {
      if (okunan.data != barcode) {
        setBarcode(okunan.data);
        servis(okunan.data);
        console.log(okunan.data);
      }
    }
    return "";
  }

  const Item = ({ data }: { data: IProduct }) => (
    <TouchableOpacity onPress={() => { console.log("flat List Touch : " + data.product_name)} }>
    <View
      style={{
        backgroundColor: '#eeeeee',
        borderRadius: 0,
        padding: 7,
        marginTop: 10,
        marginHorizontal: 4,
        width: width,
      }}>
      <Text style={{ fontSize: 12, color:'black' }}>Ürün: {data.product_name}</Text> 
      <Text style={{ fontSize: 12,color:'black' }}>Stok: {data.stock}</Text> 
      <Text style={{ fontSize: 12,color:'black' }}>Fiyat: {data.price}</Text>
    </View>
    </TouchableOpacity>
  );

  const renderItem = (item:any, index:any) => {

  }

  function SalesScreen() {
    return( <SafeAreaView style={styles.container}>
      <View style={styles.camcontainer} >
      <RNCamera ref={cameraref}
        style={styles.camera}
        type={type}
        captureAudio={false}
        onGoogleVisionBarcodesDetected={({ barcodes }) => {
          ReadedBarcode(barcodes[0])
          //console.log(barcodes);
        }}
        googleVisionBarcodeMode={RNCamera.Constants.GoogleVisionBarcodeDetection.BarcodeMode.ALTERNATE}
      >
      </RNCamera>
      <Text style={styles.toplamText }>Toplam : {toplam}</Text>
      </View>
        <View style={{ flex: 1, marginTop: 20, marginBottom:20 }}>
          <FlatList
            data={datas}
            renderItem={({ item }) => <Item data={item} />}
            keyExtractor={(item: IProduct) => item.id}
          />
        </View>
    </SafeAreaView>);
  }

  function alert(arg0: string): void {
    throw new Error('Function not implemented.');
  }

  return (
    <NavigationContainer>{/* Rest of your app code */}
    <Stack.Navigator>
        <Stack.Screen name="Main" component={MainScreen} ></Stack.Screen>
        <Stack.Screen name="Kasa" component={SalesScreen} options={{
          headerTitle: (props) => <LogoTitle {...props} />,
          headerLeft: () => (
            <Button
              onPress={() => this.props.navi}
              title="Info"
              color="#fff"
            />
          ),
        }}/>
      </Stack.Navigator>
    </NavigationContainer>

   
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'grey',
    //alignItems: 'center'
  },
  camcontainer:{
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems:'flex-end',
    justifyContent: 'space-between',
  },
  camera: {
    //alignItems:'flex-end',
    //alignSelf: 'flex-end',
    marginLeft: 10,
    width: 150,
    height: 150,
    alignItems:'flex-start',
    alignSelf: 'flex-start',
    marginBottom: 0,
  },
  toplamText:{
    marginLeft:10,
    color:'black',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: -23,
    alignItems:'flex-end',
    alignSelf: 'flex-end',
    
  },
  item: {
    //marginTop: 100,
    backgroundColor: '#f9c2ff',
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 11,
  },
  title: {
    fontSize: 32,
  },
});

export default App;


