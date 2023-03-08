import react from 'react'
import { Text } from 'react-native';

export function OrderDetail(props: any): JSX.Element {
    const { itemId, otherParam, order } = props.route.params;

    console.log("ORderDetail : ",order.id)
return(
    <>
    <Text>Order ID : {order.id}</Text>
    <Text>Order Price : {order.price}</Text>
    <Text>Order Piece : {order.piece}</Text>
    </>
)
}