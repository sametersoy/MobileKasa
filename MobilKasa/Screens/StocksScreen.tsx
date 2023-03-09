import React, { useEffect, useState } from 'react';
import { GetPaging } from '../Services/GetProduct';
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

export function generateUUID(digits:number) {
  let str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVXZ';
  let uuid = [];
  for (let i = 0; i < digits; i++) {
      uuid.push(str[Math.floor(Math.random() * str.length)]);
  }
  return uuid.join('');
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



const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

function StockScreen(props:any): JSX.Element {
    const [datas, setDatas] = useState([{}])
    const [loading, setLoading] = useState(false)
    const [searchVisibility, setSearchVisibility] = useState(false)

    const [searchPhrase, setSearchPhrase] = useState("");
    const [clicked, setClicked] = useState(false);
    const [fakeData, setFakeData] = useState();
    useEffect(() => {
        servis(0);
        props.navigation.setOptions({
          headerRight: () => (
            <><Icon
              name="search"
              size={25}
              color="black"
              style={{ marginLeft: 20 }} 
              onPress={() => {
               searchVisibility ? setSearchVisibility(false):setSearchVisibility(true);
              }} 
              />
              <Icon
              name="create-new-folder"
              size={25}
              color="black"
              style={{ marginLeft: 20 }} 
              onPress={() => {
                props.navigation.navigate("NewProduct");
              }} 
              /></>
          ),
        });
    }, []); 
    
    async function servis(page_count: number): Promise<void> {
        setLoading(true);
       await GetPaging(page_count).then((data) => {
          console.log("StockScreen servis : "+data)
          data.forEach((d,index) => {
            datas.push({ id: d.id, barcode: d.barcode, product_name: d.product_name, stock: d.stock, price: d.price, guid: generateUUID(10) });
        });
          //datas.push({ id: data.id, barcode: data.barcode, product_name: data.product_name, stock: data.stock, price: data.price });
          setDatas(datas)
          setLoading(false);
        }).catch((error) => {
          console.log("error");
          console.error(error);
        });
      }
     function onPressItem(product: IProduct): void {
        console.log("Tıklanan Ürün : "+product)
      }

    async function getMoreProduct () {
        console.log("getMoreProduct : "+ datas.length)
       await servis(datas.length - 1 );

    };

    const Item = ({ data }: { data: IProduct }) => (
        <TouchableOpacity onPress={() => { 
          console.log("TouchableOpacity : " + data.id)
          console.log("ıtem : " +  data.price)
          //onPressItem(data)
          props.navigation.navigate("StockDetail",{
            itemId: 86,
            otherParam: 'anything you want here',
            stock:data
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
        
          <Text style={{ fontSize: 12, color:'black' }}>Ürün: {data.product_name}</Text> 
          <Text style={{ fontSize: 12,color:'black' }}>Stok: {data.stock}</Text> 
          <Text style={{ fontSize: 12,color:'black' }}>Fiyat: {data.price}</Text>
          <View style={{flex:1, position:'absolute', flexDirection:'column', justifyContent:'center', alignItems:'flex-end',alignSelf:'flex-end',alignContent:'center' }}>
          <Icon style={{ justifyContent:'flex-end', alignItems:'center',  }} name="chevron-right" size={50} color="grey" />
          </View>
          </View>  
          : null }  
        </TouchableOpacity> 
      );

     function footerIndicator  () {
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
          {searchVisibility ?
          <SearchBar searchPhrase={searchPhrase}
        setSearchPhrase={setSearchPhrase}
        clicked={clicked}
        setCLicked={setClicked} />
        :null}
        <FlatList
          data={datas}
          renderItem={({ item }) => (
            <Item data={item} />
          )}
          keyExtractor={(item: IProduct) => item.guid}
          onEndReached={getMoreProduct}
          onEndReachedThreshold={0.2}
          ListFooterComponent={footerIndicator}

        />
      </SafeAreaView >
    );

}
export default StockScreen;
