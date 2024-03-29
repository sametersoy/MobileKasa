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
import Icon from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../Components/Colors';
import { generateUUID } from '../Components/GenerateGUID';
import Dropdown from '../Components/Dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IProduct } from '../Models/IProduct';
import { IBarcode } from '../Models/IBarcode';
import Input from '../Components/Input';



const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
TrackPlayer.setupPlayer();
const selectedData = [
  { label: 'Kredi K.', value: 'Kredi K.' },
  { label: 'Nakit', value: 'Nakit' },
];

interface ISelected {
  label: string,
  value: string
}



let CamStatus: any;
let SoundStatus: string | null;



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
  }, [props.navigation,]);

  let nettoplam: number = 0.0;
  function toplamHesapla(datas: IProduct[]) {
    console.log('Toplam Hesapla : ' + datas);
    if (datas.length == 0) {
      setToplam(0);
    }
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
    if (SoundStatus == "A") {
      CallMusicStart();
    }
    await GetProduct(barcode).then((data) => {
      let g_price: any = "";
      let g_stock: any = "";
      if (data) {
        if (data.price != null && data.price != undefined && data.price != "") {
          const dataProduct: IProduct = {
            id: data.id,
            barcode: data.barcode,
            product_name: data.product_name,
            price: data.price,
            stock: data.stock,
            kdv: "",
            guid: generateUUID(10)
          };
          datas?.push(dataProduct);
          console.log('else nothing : ' + dataProduct.guid);


        } else {
          console.log('else nothing');
          setModalBarcode(barcode)
          setModalUrunAdi(data.product_name);
          setisModalVisible(true)
          const dataProduct: IProduct = {
            id: data.id,
            barcode: data.barcode,
            product_name: data.product_name,
            price: "0",
            stock: "0",
            kdv: "",
            guid: generateUUID(10)
          };
          console.log('else nothing : ' + dataProduct.guid);

          datas?.push(dataProduct);
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

  function onPressItem(product: IProduct): void {
    console.log("Tıklanan Ürün : " + product)
    let n_data: IProduct[];
    datas.forEach((d, index) => {
      console.log("product.guid : " + product.guid)
      console.log("data.guid : " + d.guid)

      if (d.guid == product.guid) {
        console.log("silinecek data : " + product.guid)
        n_data = datas.filter(item => item.guid != product.guid);
        toplamHesapla(n_data);
        setDatas(n_data)
      }
    })
  }

  const [type, setType] = useState(CamStatus);
  const cameraref = useRef(null);

  const [barcode, setBarcode] = useState("");
  const [toplam, setToplam] = useState(0.0);
  const [datas, setDatas] = useState<IProduct[]>([])
  const [isModalVisible, setisModalVisible] = useState(false)

  const [modalBarcode, setModalBarcode] = useState<string>("")
  const [modalUrunAdi, setModalUrunAdi] = useState<string>("")
  const [modalPrice, setModalPrice] = useState<string>("0")
  const [modalStock, setModalStock] = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ISelected>({ label: "Nakit", value: "Nakit" });

  async function CamSetControl() {
    let CamSetting = await AsyncStorage.getItem('CamSetting');
    if (CamSetting == 'B') {
      console.log('CamSetControl shop screen : ' + CamSetting);
      CamStatus = RNCamera.Constants.Type.back
    }
    if (CamSetting == 'F') {
      console.log('CamSetControl shop screen : ' + CamSetting);
      CamStatus = RNCamera.Constants.Type.front
    }
    setType(CamStatus)
  }
  CamSetControl()

  async function SoundSetControl() {
    SoundStatus = await AsyncStorage.getItem('SoundSetting');
  }
  SoundSetControl()
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
    const data: IProduct = {
      id: prod_id,
      barcode: p_barcode,
      product_name: p_name,
      price: p_price,
      stock: p_stock,
      kdv: "",
      guid: generateUUID(10)
    };

    datas?.push(data);
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
      total_price = total_price + Number(order.price)
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
            let orderDetail: IOrderDetail = { order_id: order_id, product_id: Number(order.id), price: Number(order.price) }
            orderDetails.push(orderDetail)
            console.log("orderdetail shopscreen : " + orderDetail)
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
  const handleOnchange = (text: any, input: string) => {
    //setModalBarcode(prevState => ({ ...prevState, [input]: text }));
    //setModalBarcode(text)

  };
  const handleError = (error: string | null, input: string) => {
    //setErrors(prevState => ({ ...prevState, [input]: error }));
  };
  let lastreaded = Date.now();
  function ReadedBarcode(okunan: IBarcode, readTime: number): string {
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
          flex:1,
          height: '55%',
          marginTop: 0,
          marginBottom:0,
          backgroundColor: COLORS.white,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}>
                    
          <Text style={{ margin: 10 }}>Okunan Barkod Sistemde Bulunamamıştır. Lüfen Ürün Bilgilerini giriniz.</Text>
          <Input
            onFocus={() => handleError(null, 'modalBarcode')}
            iconName="qr-code-scanner"
            label="Barcode"
            placeholder="Barcode Numası giriniz"
            //error={modalBarcode}
            columnTitle={''}
            password={undefined}
            value={modalBarcode.toString()}
            onChangeText={function (text: any): void {
              console.log("onChangeText : " + text)
              //handleOnchange(text, 'barcode')
              setModalBarcode(text)
            }}
          />
          {/*   <TextInput
            style={{ height: 40, backgroundColor: 'azure', margin: 2, fontSize: 18 }}
            placeholder="Barkod"
            value={modalBarcode}
            onChangeText={(text) => setModalBarcode(text)}
          ></TextInput> */}
          <Input
            onFocus={() => handleError(null, 'modalUrunAdi')}
            iconName="drive-file-rename-outline"
            label="Ürün Adı"
            placeholder="Ürün Adı giriniz"
            //error={modalBarcode}
            columnTitle={''}
            password={undefined}
            value={modalUrunAdi.toString()}
            onChangeText={function (text: any): void {
              console.log("onChangeText : " + text)
              //handleOnchange(text, 'barcode')
              setModalUrunAdi(text)
            }}
          />
          {/*  <TextInput
            style={{ height: 40, backgroundColor: 'azure', margin: 2, fontSize: 18 }}
            placeholder="Ürün Adı"
            value={modalUrunAdi}
            onChangeText={(text) => setModalUrunAdi(text)}
          ></TextInput> */}
          <Input
            onFocus={() => handleError(null, 'modalPrice')}
            iconName="attach-money"
            label="Ürün Fiyat"
            placeholder="Fiyat giriniz"
            //error={modalBarcode}
            columnTitle={''}
            password={undefined}
            value={modalPrice.toString()}
            onChangeText={function (text: any): void {
              console.log("onChangeText : " + text)
              //handleOnchange(text, 'barcode')
              setModalPrice(text)
            }}
          />
          <Input
            onFocus={() => handleError(null, 'modalStock')}
            iconName="storage"
            label="Stok Adet"
            placeholder="Fiyat giriniz"
            //error={modalBarcode}
            columnTitle={''}
            password={undefined}
            value={modalStock.toString()}
            onChangeText={function (text: any): void {
              console.log("onChangeText : " + text)
              //handleOnchange(text, 'barcode')
              setModalStock(text)
            }}
          />
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
        <View style={{
          alignItems: 'center',
          alignSelf: 'center',
          justifyContent: 'center',
          backgroundColor: 'blue',
          width: width - 170,
          height: 30,
          borderRadius: 10,
          margin: 10,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: COLORS.white,
            alignItems: 'center',
            alignSelf: 'center',
            justifyContent: 'center',
          }}>Toplam : {toplam}</Text>
        </View>
        <View style={{
          alignItems: 'center',
          alignSelf: 'center',
          justifyContent: 'center',
          backgroundColor: 'blue',
          width: width - 170,
          height: 30,
          borderRadius: 10,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: COLORS.white,
            alignItems: 'center',
            alignSelf: 'center',
            justifyContent: 'center',

          }}>Adet : {datas.length}</Text>
        </View>

        <Dropdown label="Nakit" data={selectedData} onSelect={setSelected} />
        <TouchableOpacity style={styles.btnOrder} onPress={orderClick}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.white, alignItems: 'center', alignSelf: 'center', justifyContent: 'center' }}>SATIŞ</Text>
        </TouchableOpacity>

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
    borderRadius: 50
  },
  camera: {
    //alignItems:'flex-end',
    //alignSelf: 'flex-end',
    borderRadius: 50,
    marginLeft: 7,
    width: 150,
    height: 150,
    alignSelf: 'stretch'
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
  btnOrderView: {
    //position: 'absolute',
    color: COLORS.blue,
    fontSize: 20,
    fontWeight: 'bold',
    //width: '180%',

  },
  btnOrder: {
    backgroundColor: 'blue',
    width: width - 170,
    height: 30,
    borderRadius: 10,
    margin: 10,


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
  label: {
    marginVertical: 5,
    fontSize: 14,
    color: COLORS.grey,
  },
  inputContainer: {
    height: 45,
    backgroundColor: COLORS.light,
    flexDirection: 'row',
    paddingHorizontal: 15,
    borderWidth: 0.5,
  },
});

export default ShopScreen;  