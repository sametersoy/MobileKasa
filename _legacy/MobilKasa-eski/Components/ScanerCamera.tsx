
import type { PropsWithChildren } from 'react';
import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Dimensions,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import { RNCamera } from 'react-native-camera';
import TrackPlayer from 'react-native-track-player';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

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
  const [box, setBox] = useState(null);
  const cameraref = useRef(null);
  const [type, setType] = useState(RNCamera.Constants.Type.back);

  const [barcode, setBarcode] = useState("");
  const [product_name, setProduct_name] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

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
  TrackPlayer.setupPlayer();

  const MusicStart = async () => {
    // Set up the player
    
    await TrackPlayer.reset();
  
    // Add a track to the queue
    await TrackPlayer.add({
        id: 'trackId',
        url: require('./Barcode-scanner-beep-sound.mp3'),
        title: 'Track Title',
        artist: 'Track Artist',
    });
  
    // Start playing it
    await TrackPlayer.play();
    
  
  };
  async function servis(barcode: string): Promise<string> {
    //fetch('http://192.168.1.155:5001/Product/GetProducts?barcode='+barcode, {

    fetch('http://192.168.1.155:5001/Product/GetProducts?barcode='+barcode, {
      method: "GET",
      headers: { "Content-type": "application/json" }
    }).then((response) => response.json()).then((json) => {
      console.log(json[0])
      console.log(json[0].product_name)
      MusicStart(); 
      setProduct_name(json[0].product_name);
      setPrice(json[0].price)
      setStock(json[0].stock)
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
export function ScanerCamera(): JSX.Element{
    return (
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
    )
}
 


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
      height: height,
      width: width
    },
    camera: {
      height: height,
      width: width
    },
    sectionContainer: {
      marginTop: 32,
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '600',
    },
    sectionDescription: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: '400',
    },
    highlight: {
      fontWeight: '700',
    },
  });