import react, { useEffect, useState } from 'react'
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GetOrderDetail } from '../Services/OrderServis';
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

interface OrderDetail {
    id: string,
    order_id: string,
    product_id: string,
    price: string,
    company_id: string,
    updated_date: string,
    created_date: string,
    created_by: string,
    updated_by: string

}

export function OrderDetail(props: any): JSX.Element {
    const { itemId, otherParam, order } = props.route.params;
    console.log("ORderDetail screen: ", order.id)
    const [datas, setDatas] = useState<OrderDetail[]>()


    useEffect(() => {
        GetOrderDetail(order.id).then((res: OrderDetail[]) => {
            console.log(res)
            setDatas(res)
            res.forEach(d => {
                console.log(d)
            })
            //let orderDetail:OrderDetail = res.json();    
        });
    },[])
    const Item = ({ data }: { data: OrderDetail }) => (

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
            {//data.id ? 
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

                    <Text style={{ fontSize: 12, color: 'black' }}>product_id: {data.product_id}</Text>
                    <Text style={{ fontSize: 12, color: 'black' }}>price: {data.price}</Text>
                    <Text style={{ fontSize: 12, color: 'black' }}>Fiyat: {data.price}</Text>
                    <View style={{ flex: 1, position: 'absolute', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', alignSelf: 'flex-end', alignContent: 'center' }}>
                        <Icon style={{ justifyContent: 'flex-end', alignItems: 'center', }} name="chevron-right" size={50} color="grey" />
                    </View>
                </View>
                //: null 
            }
        </TouchableOpacity>
    );
    return (
        <>
            <Text>Order ID : {order.id}</Text>
            <Text>Order Price : {order.price}</Text>
            <Text>Order Piece : {order.piece}</Text>

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