import react, { useEffect, useState } from 'react'
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GetProduct } from '../Services/GetProduct';
import { DeleteOrderDetail, GetOrderDetail } from '../Services/OrderServis';
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
    product_name: string,
    product_price: string
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
    }, [])

    async function orderDetailDelete(orderDetail: string){
        await DeleteOrderDetail(orderDetail).then(() => {
            datas?.forEach((d,i) => {
                if (d.id == orderDetail) {
                    let datass = datas.slice(0, i)
                    setDatas(datass)
                }
            })
        })
    }

    const Item = ({ data }: { data: OrderDetail }) => (
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

            <Text style={{ fontSize: 12, color: 'black' }}>Ürün Adı: {data.product_name}</Text>
            <Text style={{ fontSize: 12, color: 'black' }}>Ürün Fiyatı: {data.product_price}</Text>
            <View style={{ flex: 1, position: 'absolute', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', alignSelf: 'flex-end', alignContent: 'center' }}>
                <Icon style={{ justifyContent: 'flex-end', alignItems: 'center', }} name="delete-forever" size={50} color="grey" 
                onPress={() => {
                    console.log("orderdetail screen delete : " + data.id)
                    orderDetailDelete(data.id);
                }} 
                />
            </View>
        </View>

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