import react, { useEffect, useState } from 'react';
import view, { ActivityIndicator, Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { GetOrder } from '../Services/OrderServis';
import { generateUUID } from '../Components/GenerateGUID';
import { getParsedDate } from '../Components/ParseDate';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { IProduct } from '../Models/IProduct';


const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;


function OrderScreen(props: any): JSX.Element {
  const [datas, setDatas] = useState([{}])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    servis();
  }, []);

  async function servis(): Promise<void> {
    setLoading(true);
    await GetOrder().then((data) => {
      console.log("GetOrder Orderscreen : " + data)
      data.forEach((d: any) => {
        datas.push({ id: d.id, price: d.price, piece: d.piece, created_date: d.created_date, guid: generateUUID(10) });
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
    console.log("Tıklanan Ürün : " + product)
  }

  async function getMoreProduct() {
    console.log("getMoreProduct : " + datas.length)
    //await servis(datas.length - 1 );

  };

  const Item = ({ data }: { data: IProduct }) => (
    <TouchableOpacity onPress={() => {
      console.log("TouchableOpacity : " + data.id)
      onPressItem(data)
      props.navigation.navigate("OrderDetail", {
        itemId: 86,
        otherParam: 'anything you want here',
        order: data
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
          <Text style={{ fontSize: 12, color: 'black' }}>Adet Ürün: {data.piece}</Text>
          <Text style={{ fontSize: 12, color: 'black' }}>Toplam Fiyat: {data.price}</Text>
          <Text style={{ fontSize: 12, color: 'black' }}>Tarih: {data.created_date ? getParsedDate(data.created_date) : null}</Text>
          <View style={{ flex: 1, position: 'absolute', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', alignSelf: 'flex-end', alignContent: 'center' }}>
            <Icon style={{ justifyContent: 'flex-end', alignItems: 'center', }} name="chevron-right" size={50} color="grey" />
          </View>
        </View>
        : null
      }
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
      <FlatList
        data={datas}
        renderItem={({ item }) => (
          <Item data={item} />
        )}
        keyExtractor={(item: IProduct) => item.guid}
        //onEndReached={getMoreProduct}
        //onEndReachedThreshold={0.2}
        ListFooterComponent={footerIndicator}

      />
    </SafeAreaView >
  );

}
export default OrderScreen