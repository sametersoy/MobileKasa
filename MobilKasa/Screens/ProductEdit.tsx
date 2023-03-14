import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    Keyboard,
    ScrollView,
    Alert,
    TouchableOpacity,
    TextInput,

} from 'react-native';

import COLORS from '../Components/Colors';
import Button from '../Components/Button';
import Input from '../Components/Input';
import Loader from '../Components/Loader';
import { ProductAdd, UpdateProduct } from '../Services/GetProduct';
import { AddPrice } from '../Services/PriceServis';
import { AddStock } from '../Services/StokServis';
import { IProduct } from '../Models/IProduct';
import { IPrices } from '../Models/IPrice';
import { IProductDetail } from '../Models/IProductDetail';
interface Props {
    error: any
    iconName: string
    label: string
    password: any
    onFocus: any
    test:string
}

export function ProductEdit(props: any): JSX.Element {
    const [inputs, setInputs] = React.useState({
        barcode: '',
        productname: '',
        price: '',
        stock: '',
    });
    const [errors, setErrors] = React.useState({
        barcode: '',
        productname: '',
        price: '',
        stock: '',
    });
    const [loading, setLoading] = React.useState(false);
    const [product, setProduct] = useState<IProduct>(props.route.params.stock)
    const [product_detail, setProduct_Detail] = useState<IProductDetail>(props.route.params.datas)
    const [prices, setPricess] = useState<IPrices[]>(props.route.params.prices)
    console.log('Product Edit : '+ product.barcode);

   async function register() {
        setLoading(true);
        /*setTimeout(() => {
            try {
                AsyncStorage.setItem('userData', JSON.stringify(inputs));
                props.navigation.navigate('LoginScreen');
            } catch (error) {
                Alert.alert('Error', 'Something went wrong');
            }
        }, 3000);*/

        console.log("1 : "+inputs.barcode);
        
        await UpdateProduct(product).then((data) => {
          console.log("productEdit Screen UpdateProduct: " + data.id)
          setProduct(data)
    
        }).catch((error) => {
          console.log("productEdit Screen AddProduct error");
          console.error(error);
        });
   
         await AddPrice(product.id, product.price).then((price) => {
          console.log("productEdit Screen AddPrice: " + price.id)
          
          setProduct(product => ({
            ...product,
            price:price.price
          }))
          console.log("productEdit Screen n_data: " + product.price)

        }).catch((error) => {
          console.log("productEdit Screen AddPrice error");
          console.error(error);
        }); 
       /*  await AddStock(prod_id, inputs.stock).then((stok) => {
          console.log("productEdit Screen AddStock: " + stok.id)
          p_stock = stok.piece;
        }).catch((error) => {
          console.log("productEdit Screen AddStock error");
          console.error(error);
        }); */
        Alert.alert('İşlem Başarılı', 'Ürün Başarı ile Güncelledi');
       /*  handleOnchange("", 'barcode')
        handleOnchange("", 'productname')
        handleOnchange(0, 'price')
        handleOnchange(0, 'stock')
        setInputs({
            barcode: '',
            productname: '',
            price: '',
            stock: '',
        })
        setErrors({
            barcode: '',
            productname: '',
            price: '',
            stock: '',
        }) */
        //props.navigation.navigate('Main');


        setLoading(false);
    };

    const handleOnchange = (text: any, input: string) => {
        setProduct(prevState => ({ ...prevState, [input]: text }));
    };
    const handleError = (error: string | null, input: string) => {
        setErrors(prevState => ({ ...prevState, [input]: error }));
    };


    return (<SafeAreaView style={{ backgroundColor: COLORS.white, flex: 1 }}>
        <Loader visible={loading} />
        <ScrollView
            contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20 }}>

            <Text style={{ color: COLORS.grey, fontSize: 18, marginVertical: 10 }}>
                Ürün güncellemek için aşağıdaki bilgileri kullanınız.
            </Text>
            <View style={{ marginVertical: 20 }}>
                <Input
                    onFocus={() => handleError(null, 'barcode')}
                    iconName="qr-code-scanner"
                    label="Barcode"
                    placeholder="Barcode Numası giriniz"
                    error={errors.barcode}
                    columnTitle={''}
                    password={undefined}
                    value={product.barcode}
                    onChangeText={function (text: any): void {
                        console.log("onChangeText : " + text)
                        
                        handleOnchange(text, 'barcode')
                    }} 
                />
                <Input
                    onFocus={() => handleError(null, 'product_name')}
                    iconName="drive-file-rename-outline"
                    label="Ürün Adı"
                    placeholder="Ürün Adı Giriniz"
                    error={errors.productname}
                    columnTitle={''}
                    password={undefined}
                    value={product.product_name}
                    onChangeText={function (text: any): void {
                        console.log("onChangeText : " + text)
                        handleOnchange(text, 'product_name')
                    }} 
                />
                <Input
                    onFocus={() => handleError(null, 'price')}
                    iconName="monetization-on"
                    label="Ürün Fiyat"
                    placeholder="Ürün Fiyatı Giriniz"
                    error={errors.price}
                    columnTitle={''}
                    password={undefined}
                    value={product.price?.toString()}
                    onChangeText={function (text: any): void {
                        console.log("onChangeText : " + text)
                        handleOnchange(text, 'price')
                    }}
                />
                <Input
                    onFocus={() => handleError(null, 'stock')}
                    iconName="storage"
                    label="Stok Adet"
                    placeholder="Stok Adeti Giriniz"
                    error={errors.stock}
                    columnTitle={''}
                    password={undefined}
                    value={product.stock}
                    onChangeText={function (text: any): void {
                        console.log("onChangeText : " + text)
                        handleOnchange(text, 'stock')
                    }}
                />
                <TouchableOpacity
                    onPress={() => {
                        register();
                        console.log("Kaydet Test : "+JSON.stringify(product));
                    }}
                    activeOpacity={0.7}
                    style={{
                        height: 55,
                        width: '100%',
                        backgroundColor: COLORS.blue,
                        marginVertical: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 18 }}>
                        Kaydet
                    </Text>
                </TouchableOpacity>

            </View>
        </ScrollView>
    </SafeAreaView>
    )
}

export default ProductEdit


