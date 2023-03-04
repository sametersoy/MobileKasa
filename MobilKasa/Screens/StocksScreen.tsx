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
    useEffect(() => {
        servis(0);
        props.navigation.setOptions({
          headerRight: () => (
            <Button onPress={() => {
              props.navigation.navigate("NewProduct");
            }} title="Yeni Ürün" />
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
          onPressItem(data)
          }}>
        {//data.product_name ?  
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
          //: null 
        }
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
