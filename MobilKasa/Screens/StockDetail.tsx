import react, { useEffect, useState } from 'react'
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GetProduct } from '../Services/GetProduct';
import { DeleteOrderDetail, GetOrderDetail } from '../Services/OrderServis';
import { GetStockDetails } from '../Services/StokServis';
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

interface StockDetail {
  id:string,
  expiration_date: string,
  supplier: string,
  production_date: string,
  picture: string,
  product_id: string,
  created_date: string,
  updated_date: string,
  created_by: string,
  updated_by: string
}

export function StockDetail(props: any): JSX.Element {
    const { itemId, otherParam, stock } = props.route.params;
    console.log("StockDetail screen: ", stock.id)
    const [datas, setDatas] = useState<StockDetail[]>()


    useEffect(() => {
      GetStockDetails(stock.id).then((res: StockDetail[]) => {
            console.log(res)
            setDatas(res)
           /*  res.forEach(d => {
                console.log(d)
            }) */
        });
    }, [])


    const Item = ({ data }: { data: StockDetail }) => (
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

            <Text style={{ fontSize: 12, color: 'black' }}>Tedarikci: {data.supplier}</Text>
            <Text style={{ fontSize: 12, color: 'black' }}>SKK: {data.product_id}</Text>
            <View style={{ flex: 1, position: 'absolute', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', alignSelf: 'flex-end', alignContent: 'center' }}>
                <Icon style={{ justifyContent: 'flex-end', alignItems: 'center', }} name="delete-forever" size={50} color="grey" 
                onPress={() => {
                    console.log("stokdetail screen delete : " + data.id)
                }} 
                />
            </View>
        </View>

    );
    return (
        <>
            <Text>Order ID : {stock.id}</Text>
            <Text>Order Price : {stock.price}</Text>
            <Text>Order Piece : {stock.piece}</Text>

            <FlatList
                data={datas}
                renderItem={({ item }) => (
                    <Item data={item} />
                )}
            //keyExtractor={(item: IProduct) => item.guid}
            //onEndReached={getMoreProduct}
            //onEndReachedThreshold={0.2}
            //ListFooterComponent={footerIndicator}

            />
        </>
    )
}

export default StockDetail