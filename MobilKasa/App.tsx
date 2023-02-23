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
} from 'react-native';

import { RNCamera } from 'react-native-camera';
import { CallMusicStart } from './Components/TrackPlayer';
import TrackPlayer from 'react-native-track-player';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { Float } from 'react-native/Libraries/Types/CodegenTypes';


const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
TrackPlayer.setupPlayer();


export interface IServis {
  barcode: string;
  product_name?: string;
  price?: string;
  stock?: string;
}
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



function App(): JSX.Element {
  let nettoplam: number = 0.0;

  function toplamHesapla(Products: IProduct[]): any {
    console.log(Products);
    Products.forEach((element,index)  => {
      console.log(nettoplam + parseFloat(element.price));
      //nettoplam=nettoplam + parseFloat(element.price)
      console.log(element.id)
      /*if (element.id=='999999'){
        Products.slice(index)
      }*/
      setToplam(toplam + parseFloat(element.price));

    });

  }
  async function servis(barcode: string): Promise<string> {
    //fetch('http://192.168.1.155:5001/Product/GetProducts?barcode='+barcode, {

    fetch('http://192.168.1.155:5001/Product/GetProducts?barcode=' + barcode, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      console.log(json[0])
      console.log(json[0].product_name)
      CallMusicStart();
      //MusicStart(); 
      setProduct_name(json[0].product_name);
      setPrice(json[0].price)
      setStock(json[0].stock)
      const value: IProduct[] = Products;
      value.push({ id: json[0].id, barcode: json[0].barcode, product_name: json[0].product_name, stock: json[0].stock, price: json[0].price });
      setData(value)
      toplamHesapla(value);
      return json;
    }).catch((error) => {
      console.log("error");
      setProduct_name("Ürün Bulunamadı.");
      setPrice("Fiyat Bulunamadı")
      setStock("Stok Bulunamadı")
      console.error(error);
    });

    return "";

  }
  const [type, setType] = useState(RNCamera.Constants.Type.back);
  const cameraref = useRef(null);

  const [barcode, setBarcode] = useState("");
  const [toplam, setToplam] = useState(0.0);
  const [product_name, setProduct_name] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [datas, setData] = useState(Products)
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
    <View
      style={{
        backgroundColor: '#eeeeee',
        borderRadius: 0,
        padding: 10,
        marginVertical: 8,
        marginHorizontal: 4,
        width: width,
      }}>
      <Text style={{ fontSize: 12 }}>Ürün: {data.product_name} || Stok: {data.stock} ||Fiyat {data.price}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      {datas.length > 1 ?
        <View style={{ flex: 1 }}>
          <FlatList
            data={datas}
            renderItem={({ item }) => <Item data={item} />}
            keyExtractor={(item: IProduct) => item.id}
          />
        </View>
        : <Text>not</Text>}
        <View style={styles.bottom}>
        <Text style={{ fontSize: 30, color: 'white' }}>Toplam : {toplam}</Text>
        {/*<Text>Ürün : {product_name}</Text>
        <Text>Fiyat: {price}</Text>
      <Text>Stok Adet: {stock}</Text>*/}
      </View>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'grey',
    alignItems: 'center'
  },
  camera: {
    marginTop: 10,
    width: 100,
    height: 150,
  },
  bottom: {
    flexDirection: 'row',
    color: 'white',
    width: width,
    fontSize: 20,
    fontWeight: 'bold',
  },
  item: {
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


