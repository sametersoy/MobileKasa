import second, { useState } from 'react'

import {
    Text,
    View,
    Dimensions,
    FlatList,
  } from 'react-native';
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
  const width = Dimensions.get('window').width;

  export function ScannerFlatList(Test:IProduct):JSX.Element {
    const [datas, setData] = useState(Products)
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
            {datas.length > 1 ?
          <Text style={{ fontSize: 12 }}>Ürün: {data.product_name} || Stok: {data.stock} ||Fiyat {data.price}</Text>
          :<Text></Text>}
        </View>
      );
  return(
    <FlatList
            data={datas}
            renderItem={({ item }) => <Item data={item} />}
            keyExtractor={(item: IProduct) => item.id}
          />
  )

}

export default ScannerFlatList