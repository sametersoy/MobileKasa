import react from 'react'
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
export function StockDetail(props: any): JSX.Element {
    const { itemId, otherParam, stock } = props.route.params;

    console.log("ORderDetail : ",stock.id)
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
return(
    <>
    <Text>Order ID : {stock.id}</Text>
    <Text>Order Price : {stock.price}</Text>
    <Text>Order Piece : {stock.product_name}</Text>
    </>
)
}

export default StockDetail