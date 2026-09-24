import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import { GetPaging, GetProductSearch } from '../Services/GetProduct';
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
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SearchBar from '../Components/SearchBar';
import { generateUUID } from '../Components/GenerateGUID';
import { IProduct } from '../Models/IProduct';
import { Event } from 'react-native-track-player';


const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

function StockScreen(props: any): JSX.Element {
  const [datas, setDatas] = useState([{}])
  const [loading, setLoading] = useState(false)
  const [searchVisibility, setSearchVisibility] = useState(false)

  const [searchPhrase,setSearchPhrase ]  = useState<boolean>(false);
  const [clicked, setClicked] = useState(false);
  const [fakeData, setFakeData] = useState();
  useEffect(() => {
    servis(0);
    props.navigation.setOptions({
      headerRight: () => (
        <>{/* <Icon
          name="search"
          size={25}
          color="black"
          style={{ marginLeft: 20 }}
          onPress={() => {
            console.log('click');
            
            searchVisibility ? setSearchVisibility(false) : setSearchVisibility(true);
          }}
        /> */}
          <Icon
            name="create-new-folder"
            size={25}
            color="black"
            style={{ marginLeft:20 }}
            onPress={() => {
              props.navigation.navigate("NewProduct");
            }}
          /></>
      ),
      headerLargeTitle:true,
      headerSearchBarOptions:{
        placeHolder:'Ara',
        headerIconColor:'black',
        onChangeText: (event:any) => search(event.nativeEvent.text),
      },
      
    });
  }, []);


  async function servis(page_count: number): Promise<void> {
    if(clicked == false){

    setLoading(true);
    await GetPaging(page_count).then((data) => {
      console.log("StockScreen servis : " + data)
      /* data.forEach((d, index) => {
        datas.push({ id: d.id, barcode: d.barcode, product_name: d.product_name, stock: d.stock, price: d.price, guid: generateUUID(10) });
      }); */
      //datas.push({ id: data.id, barcode: data.barcode, product_name: data.product_name, stock: data.stock, price: data.price });
      setDatas(data)
      setLoading(false);
    }).catch((error) => {
      console.log("error");
      console.error(error);
    });
  }
  }
  function onPressItem(product: IProduct): void {
    console.log("Tıklanan Ürün : " + product)
  }

  async function getMoreProduct() {
    console.log("getMoreProduct : " + datas.length)
    if(searchPhrase == false){
      await servis(datas.length - 1);
    }
  };

  async function search(params:string):Promise<void>{
    console.log('search keyword : ' + params.length )
    if(params.length > 1){
      setSearchPhrase(true)
      setLoading(true);
      await GetProductSearch(params).then((data:IProduct[]) => {
        console.log("GetProductSearch StokScreen : " + data)
      /*   data.forEach((d, index) => {
          datas.push({ id: d.id, barcode: d.barcode, product_name: d.product_name, stock: d.stock, price: d.price, guid: generateUUID(10) });
        }); */
        //datas.push({ id: data.id, barcode: data.barcode, product_name: data.product_name, stock: data.stock, price: data.price });
        setDatas(data)
        setLoading(false);
      })
    }
    if(params.length === 0 ){
      console.log("seacth phrase : ")
      setSearchPhrase(false)
      setDatas([{}])
      servis(0)

    }
  }

  const Item = ({ data }: { data: IProduct }) => (
    <TouchableOpacity onPress={() => {
      console.log("TouchableOpacity : " + data.id)
      console.log("ıtem : " + data.price)
      //onPressItem(data)
      props.navigation.navigate("StockDetail", {
        itemId: 86,
        otherParam: 'anything you want here',
        stock: data
      })
    }}>
      {data.id ?
        <View
          style={{
            backgroundColor: '#eeeeee',
            borderBottomEndRadius: 15,
            borderTopEndRadius: 15,
            borderColor: '#000000',
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
            <Icon style={{ justifyContent: 'flex-end', alignItems: 'center', }} name="chevron-right" size={50} color="grey" />
          </View>
        </View>
        : null}
    </TouchableOpacity>
  );

  function footerIndicator() {
    return loading ? (
      <View
        style={{
          paddingVertical: 20,
        }}
      >
        <ActivityIndicator animating size="large" />
      </View>
    ) : null
  };

  return (
    <SafeAreaView>
      {/* searchVisibility ? */
      /*   <SearchBar searchPhrase={searchPhrase}
          setSearchPhrase={setSearchPhrase}
          clicked={clicked}
          setCLicked={setClicked} 
          onChangeText={(d:string) => search(d)}
          /> */
       /*  : null */}
      <FlatList
        data={datas}
        renderItem={({ item }) => (
          <Item data={item} />
        )}
        keyExtractor={(item: IProduct) => item.guid}
        onEndReached={getMoreProduct}
        //onEndReachedThreshold={0.2}
        ListFooterComponent={footerIndicator}
      />
    </SafeAreaView >
  );

}
export default StockScreen;
