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
  FlatList,
  TouchableOpacity,
  Button,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TrackPlayer from 'react-native-track-player';
import { RNCamera } from 'react-native-camera';
import { CallMusicStart } from '../Components/TrackPlayer';
import { GetProduct, ProductAdd } from '../Services/GetProduct';
import { AddPrice } from '../Services/PriceServis';
import { AddStock } from '../Services/StokServis';
import { AddOrder, AddOrderDetails, IOrderDetail } from '../Services/OrderServis';


import { Modal } from 'react-native';
import { generateUUID } from './StocksScreen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../Components/Colors';



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

export interface IProduct {
  id: string;
  barcode: string;
  product_name: string;
  price: string;
  stock: string;
  kdv: string;
  guid: string;

}

const Products = [
  {

  },

];
const Stack = createNativeStackNavigator();
let readedcount = 0;

function ShopScreen(props: any): JSX.Element {

  React.useEffect(() => {
    props.navigation.setOptions({
      /*   headerStyle: {
          backgroundColor: 'red',
          color:'white'
        }, */
      headerRight: () => (
        <Button onPress={() => {
          props.navigation.navigate("NewProduct");
        }} title="Yeni Ürün" />
      ),
    });
  }, [props.navigation]);

  let nettoplam: number = 0.0;
  function toplamHesapla(datas: any[]) {
    console.log('Toplam Hesapla : ' + datas);
    if (readedcount == 0) {
      datas.splice(0, 1);
    }
    readedcount = readedcount + 1;
    datas.forEach((element, index) => {
      nettoplam = nettoplam + parseFloat(element.price)
      console.log(nettoplam)

      if (nettoplam == 0.0) {
        nettoplam = parseFloat(element.price)
      }
      setToplam(nettoplam);
    });

  }
  async function servis(barcode: string): Promise<void> {
    console.log("Okunan Bardoce : " + barcode)
    setLoading(true);
    CallMusicStart();
    await GetProduct(barcode).then((data) => {
      let g_price: any = "";
      let g_stock: any = "";
      if (data) {
        if (data.price != null && data.price != undefined && data.price != "") {
          datas.push({ id: data.id, barcode: data.barcode, product_name: data.product_name, stock: data.stock, price: data.price, guid: generateUUID(10) });

        } else {
          console.log('else nothing');
          setModalBarcode(barcode)
          setModalUrunAdi(data.product_name);
          setisModalVisible(true)
          datas.push({ id: data.id, barcode: data.barcode, product_name: data.product_name, stock: 0, price: 0, guid: generateUUID(10) });
        }
        setDatas(datas)
        toplamHesapla(datas);
        setLoading(false);
      } else {
        setModalBarcode(barcode)
        setisModalVisible(true)
      }


    }).catch((error) => {

      console.log("error");
      console.error(error);
    });
  }

  async function onPressItem(product: IProduct): Promise<void> {
    console.log("Tıklanan Ürün : " + product)
    //setisModalVisible(true);
  }


  const [type, setType] = useState(RNCamera.Constants.Type.back);
  const cameraref = useRef(null);
  let camerareaded = 0;



  const [barcode, setBarcode] = useState("");
  const [toplam, setToplam] = useState(0.0);
  const [datas, setDatas] = useState(Products)
  const [isModalVisible, setisModalVisible] = useState(false)

  const [modalBarcode, setModalBarcode] = useState<string>("")
  const [modalUrunAdi, setModalUrunAdi] = useState<string>("")
  const [modalPrice, setModalPrice] = useState<string>("")
  const [modalStock, setModalStock] = useState<string>("0")
  const [loading, setLoading] = useState(false)

  async function AddProduct(): Promise<void> {
    console.log("AddProduct: " + modalBarcode + " : " + modalUrunAdi + " : " + modalPrice)
    setLoading(true);
    let prod_id: string = "";
    let added_product: string = "";
    let p_barcode: string = "";
    let p_name: string = "";
    let p_price: string = "";
    let p_stock: string = "";
    await ProductAdd(modalBarcode, modalUrunAdi).then((data) => {
      console.log("Shop Screen AddProduct: " + data.id)
      prod_id = data.id;
      added_product = data.barcode;
      p_barcode = data.barcode;
      p_name = data.product_name;

    }).catch((error) => {
      console.log("Shop Screen AddProduct error");
      console.error(error);
    });
    await AddPrice(prod_id, modalPrice).then((price) => {
      console.log("Shop Screen AddPrice: " + price.id)
      p_price = price.price;
    }).catch((error) => {
      console.log("Shop Screen AddPrice error");
      console.error(error);
    });
    await AddStock(prod_id, modalStock).then((stok) => {
      console.log("Shop Screen AddStock: " + stok.id)
      p_stock = stok.piece;
    }).catch((error) => {
      console.log("Shop Screen AddStock error");
      console.error(error);
    });
    setisModalVisible(false)
    datas.push({ id: prod_id, barcode: p_barcode, product_name: p_name, stock: p_stock, price: p_price, guid: generateUUID(10) });
    setDatas(datas)
    toplamHesapla(datas);
    setLoading(false);
  }

  async function orderClick() {
    console.log("orderClick");
    setLoading(true)
    let total_price: number = 0;
    let total_piece: number = 0;
    let order_id: number = 0;
    datas.forEach((order, index) => {
      total_piece = total_piece + 1;
      total_price = total_price + order.price
    })
    if (total_piece > 0) {
      await AddOrder(total_price, total_piece).then((res) => {
        console.log(res.id)
        order_id = res.id
        console.log("oRder ID : " + order_id)
      }).catch((error) => {
        console.log("orderClick shopscreen error");
        console.error(error);
      })

      if (order_id != 0) {
        let orderDetails: IOrderDetail[] = []

        datas.forEach((order, index) => {
          console.log("devam");
          if (order_id != undefined && order_id != 0) {
            let orderDetail: IOrderDetail = { order_id: order_id, product_id: order.id, price: order.price }
            orderDetails.push(orderDetail)
            console.log("orderdetail : " + orderDetail)
          }
        })
        await AddOrderDetails(orderDetails).then((res) => {
          datas.splice(0, datas.length);
          setDatas(datas);
          setToplam(0);
          setLoading(false);
        }).catch((error) => {
          console.log("orderClick shopscreen AddOrderDetails error");
          console.error(error);
        })

      }
    }
    console.log("orderClick hesaplanan : " + total_price + " piece : " + total_piece);


  }

  let lastreaded = Date.now();
  function ReadedBarcode(okunan: Barcode, readTime: number): string {
    let timesec = (readTime - lastreaded)
    //console.log("timesec: "+timesec+" readed : "+ readTime);
    try {
      if (timesec > 3000) {
        servis(okunan.data);
        console.log("Servise giden barkod : " + okunan.data);
      }
    } catch (err) { }
    return "";
  }

  const Item = ({ data }: { data: IProduct }) => (
    <TouchableOpacity onPress={() => {
      console.log("TouchableOpacity : " + data.id)
      onPressItem(data)
    }}>
      {Number(data.price) > 0 ?
        <View
          style={{
            backgroundColor: '#eeeeee',
            borderRadius: 0,
            padding: 7,
            marginTop: 10,
            marginHorizontal: 4,
            width: width,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.30,
            shadowRadius: 4.65,

            elevation: 8,
          }}>

          <Text style={{ fontSize: 12, color: 'black' }}>Ürün: {data.product_name}</Text>
          <Text style={{ fontSize: 12, color: 'black' }}>Stok: {data.stock}</Text>
          <Text style={{ fontSize: 12, color: 'black' }}>Fiyat: {data.price}</Text>
          <View style={{ flex: 1, position: 'absolute', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', alignSelf: 'flex-end', alignContent: 'center' }}>
            <Icon style={{ justifyContent: 'center', alignItems: 'center', marginRight: 15, marginTop: 15 }} name="delete-outline" size={35} color="grey" />
          </View>
        </View>
        :
        <View
          style={{
            backgroundColor: '#eeeeee',
            borderRadius: 0,
            padding: 7,
            marginTop: 10,
            marginHorizontal: 4,
            width: width,
          }}>
          <Text></Text>

        </View>}
    </TouchableOpacity>
  );
  return (<SafeAreaView style={styles.container}>
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setisModalVisible(false)}
      >
        <View style={{
          height: '55%',
          marginTop: 'auto',
          backgroundColor: COLORS.white,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,

        }}><Text style={{ margin: 10 }}>Okunan Barkod Sistemde Bulunamamıştır. Lüfen Ürün Bilgilerini giriniz.</Text>
          <TextInput
            style={{ height: 40, backgroundColor: 'azure', margin: 2, fontSize: 18 }}
            placeholder="Barkod"
            value={modalBarcode}
            onChangeText={(text) => setModalBarcode(text)}
          ></TextInput>
          <TextInput
            style={{ height: 40, backgroundColor: 'azure', margin: 2, fontSize: 18 }}
            placeholder="Ürün Adı"
            value={modalUrunAdi}
            onChangeText={(text) => setModalUrunAdi(text)}
          ></TextInput>
          <TextInput
            style={{ height: 40, backgroundColor: 'azure', margin: 2, fontSize: 18 }}
            placeholder="Fiyat"
            value={modalPrice}
            onChangeText={(text) => setModalPrice(text)}
          ></TextInput>
          <TextInput
            style={{ height: 40, backgroundColor: 'azure', margin: 2, fontSize: 18 }}
            placeholder="Stok"
            value={modalStock}
            onChangeText={(text) => setModalStock(text)}
          ></TextInput>
          <Button title="Kaydet" onPress={AddProduct} ></Button>

        </View>
      </Modal>
    </View>
    <View style={styles.camcontainer} >
      <RNCamera ref={cameraref}
        style={styles.camera}
        type={type}
        captureAudio={false}
        onGoogleVisionBarcodesDetected={({ barcodes }) => {
          //console.log(barcodes);
          ReadedBarcode(barcodes[0], Date.now())
        }}
        googleVisionBarcodeMode={RNCamera.Constants.GoogleVisionBarcodeDetection.BarcodeMode.ALTERNATE}
      >
      </RNCamera>
      <View>
        <View style={styles.btnOrder}>
          <Button color={'blue'} title='Satış' onPress={orderClick}></Button>
        </View>
        <Text style={{
          color: 'black',
          fontSize: 20,
          fontWeight: 'bold',
         margin: 10,
         width: '100%',
          }}>Toplam : {toplam}</Text>
        <Text style={{
          color: 'black',
          fontSize: 20,
          fontWeight: 'bold',
          width: '100%',
          marginLeft:10,
        }}>Adet : {datas.length}</Text>
      </View>
    </View>
    <View style={{ flex: 1, marginTop: 20, marginBottom: 20 }}>
      <FlatList
        data={datas}
        renderItem={({ item }) => <Item data={item} />}
        keyExtractor={(item: IProduct) => item.guid}
      />

      {loading ? (
        <View
          style={{
            paddingVertical: 20,
          }}
        >
          <ActivityIndicator animating color={'#00ff00'} size="large" />
        </View>
      ) : null}
    </View>

  </SafeAreaView>);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'grey',
    //alignItems: 'center'
    //justifyContent: 'flex-end',
  },
  camcontainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  camera: {
    //alignItems:'flex-end',
    //alignSelf: 'flex-end',
    marginLeft: 7,
    width: 150,
    height: 150,
    //alignItems:'flex-start',
    //alignSelf: 'flex-start',
    //marginBottom: 0,
  },
  /*  toplamText: {
     marginLeft: 10,
     color: 'black',
     fontSize: 20,
     fontWeight: 'bold',
     marginBottom: -23,
     justifyContent: 'flex-end',
     alignItems: 'flex-end',
     alignSelf: 'flex-end',
     width: '100%'
 
   }, */
    btnOrder:{
     position: 'absolute',
     color: 'black',
     fontSize: 20,
     fontWeight: 'bold',
     width: '180%',
     marginTop:100
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

export default ShopScreen;  