import react, { useEffect, useState } from 'react'
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getParsedDate } from '../Components/ParseDate';
import { IPrices } from '../Models/IPrice';
import { IProductDetail } from '../Models/IProductDetail';
import { GetProduct } from '../Services/GetProduct';
import { DeleteOrderDetail, GetOrderDetail } from '../Services/OrderServis';
import { GetPrices } from '../Services/PriceServis';
import { GetStockDetails } from '../Services/StokServis';
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export function StockDetail(props: any): JSX.Element {
    const { itemId, otherParam, stock } = props.route.params;
    console.log("StockDetail screen: ", stock.id)
    const [datas, setDatas] = useState<IProductDetail>()
    const [prices, setPrices] = useState<IPrices[]>()



    useEffect(() => {
       
        GetPrices (stock.id).then((res: IPrices[]) => {
            console.log(res)
            setPrices(res)
        });
        GetStockDetails (stock.id).then((d: IProductDetail) => {
            console.log(d)
            setDatas(d)
        });
        props.navigation.setOptions({
            headerRight: () => (
              <>
                <Icon
                name="edit"
                size={25}
                color="black"
                style={{ marginLeft: 20 }} 
                onPress={() => {
                    props.navigation.navigate('ProductEdit', {
                        datas: datas ,
                        prices:prices,
                        stock:stock
                      });
                }} 
                /></>
            ),
          });
    }, [])
   
    

    const Item = ({ data }: { data: IPrices }) => (
        <View
            style={{
                backgroundColor: '#eeeeee',
                borderBottomEndRadius: 15,
                borderTopEndRadius: 15,
                borderColor: '#000000',
                padding: 7,
                margin:10,
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

            <Text style={{ fontSize: 14, color: 'black' }}>Fiyat: {data.price}</Text>
            <Text style={{ fontSize: 14, color: 'black' }}>Fiyat Tarihi: { getParsedDate(data.created_date) }</Text>
            <View style={{ flex: 1, position: 'absolute', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', alignSelf: 'flex-end', alignContent: 'center' }}>
               {/*  <Icon style={{ justifyContent: 'flex-end', alignItems: 'center', }} name="delete-forever" size={50} color="grey"
                    onPress={() => {
                        console.log("stokdetail screen delete : " + data.id)
                    }}
                /> */}
            </View>
        </View>

    );
   
    return (
        <View>
            <View style={{margin:15}}>
            <Text>Ürün ID : {stock.id}</Text>
            <Text>ürün Adı : {stock.product_name}</Text>
            <Text>Barkod : {stock.barcode}</Text>
            
            <Text style={{ color:'black', fontSize:16, marginTop:15}}>Detaylar </Text>
            <Text style={{ fontSize: 14, color: 'black' }}>Tedarikçi: {datas?.supplier}</Text>
            <Text style={{ fontSize: 14, color: 'black' }}>Kayıt Tarihi: { datas?.created_date ? getParsedDate(datas?.created_date):null }</Text>
            <Text style={{ fontSize: 14, color: 'black' }}>Kayıt Eden: { datas?.created_by }</Text>
            <Text style={{ fontSize: 14, color: 'black' }}>Güncelleme Tarihi: {datas?.updated_date ? getParsedDate(datas?.updated_date):null }</Text>
            <Text style={{ fontSize: 14, color: 'black' }}>Güncelleyen: { datas?.created_by }</Text>
            <Text style={{ fontSize: 14, color: 'black' }}>SKK: {datas?.expiration_date ? getParsedDate(datas?.expiration_date):null}</Text>
            <Text style={{ fontSize: 14, color: 'black' }}>Üretim Tarihi: {datas?.production_date ? getParsedDate(datas?.production_date):null}</Text>


            </View>
            <Text style={{ color:'black', fontSize:16, marginLeft:10, marginTop:15}}>Fiyatlar </Text>
            <FlatList
                data={prices}
                renderItem={({ item }) => (
                    <Item data={item} />
                )}
            />
        </View>
    )
}


