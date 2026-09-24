import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    Keyboard,
    ScrollView,
    Alert,
    TouchableOpacity,

} from 'react-native';

import COLORS from '../Components/Colors';
import Button from '../Components/Button';
import Input from '../Components/Input';
import Loader from '../Components/Loader';
import { ProductAdd } from '../Services/GetProduct';
import { AddPrice } from '../Services/PriceServis';
import { AddStock } from '../Services/StokServis';
interface Props {
    error: any
    iconName: string
    label: string
    password: any
    onFocus: any
}

export function NewProduct(props: any): JSX.Element {
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

/*
    function validate(): void {
        Keyboard.dismiss();
        let isValid = true;

        if (!inputs.email) {
            handleError('Please input email', 'email');
            isValid = false;
        } else if (!inputs.email.match(/\S+@\S+\.\S+/)) {
            handleError('Please input a valid email', 'email');
            isValid = false;
        }

        if (!inputs.fullname) {
            handleError('Please input fullname', 'fullname');
            isValid = false;
        }

        if (!inputs.phone) {
            handleError('Please input phone number', 'phone');
            isValid = false;
        }

        if (!inputs.password) {
            handleError('Please input password', 'password');
            isValid = false;
        } else if (inputs.password.length < 5) {
            handleError('Min password length of 5', 'password');
            isValid = false;
        }

        if (isValid) {
            register();
        }
    };
*/
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
        let prod_id: string = "";
        let added_product: string = "";
        let p_barcode: string = "";
        let p_name: string = "";
        let p_price: string = "";
        let p_stock: string = "";
        console.log("1 : "+inputs.barcode);
        
        await ProductAdd(inputs.barcode, inputs.productname).then((data) => {
          console.log("Newproduct Screen AddProduct: " + data.id)
          prod_id = data.id;
          added_product = data.barcode;
          p_barcode = data.barcode;
          p_name = data.product_name;
    
        }).catch((error) => {
          console.log("Newproduct Screen AddProduct error");
          console.error(error);
        });
   
        await AddPrice(prod_id, inputs.price).then((price) => {
          console.log("Newproduct Screen AddPrice: " + price.id)
          p_price = price.price;
        }).catch((error) => {
          console.log("Newproduct Screen AddPrice error");
          console.error(error);
        });
        await AddStock(prod_id, inputs.stock).then((stok) => {
          console.log("Newproduct Screen AddStock: " + stok.id)
          p_stock = stok.piece;
        }).catch((error) => {
          console.log("Newproduct Screen AddStock error");
          console.error(error);
        });
        Alert.alert('İşlem Başarılı', 'Ürün Başarı ile Kayıt Edildi.');
        handleOnchange("", 'barcode')
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
        })
        //props.navigation.navigate('Main');


        setLoading(false);
    };

    const handleOnchange = (text: any, input: string) => {
        setInputs(prevState => ({ ...prevState, [input]: text }));
    };
    const handleError = (error: string | null, input: string) => {
        setErrors(prevState => ({ ...prevState, [input]: error }));
    };


    return (<SafeAreaView style={{ backgroundColor: COLORS.white, flex: 1 }}>
        <Loader visible={loading} />
        <ScrollView
            contentContainerStyle={{ paddingTop: 50, paddingHorizontal: 20 }}>

            <Text style={{ color: COLORS.grey, fontSize: 18, marginVertical: 10 }}>
                Yeni bir ürün eklemek için aşağıdaki bilgileri doldurunuz.
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
                    value={inputs.barcode.toString()}
                    onChangeText={function (text: any): void {
                        console.log("onChangeText : " + text)
                        handleOnchange(text, 'barcode')
                    }}
                />
                <Input
                    onFocus={() => handleError(null, 'productname')}
                    iconName="drive-file-rename-outline"
                    label="Ürün Adı"
                    placeholder="Ürün Adı Giriniz"
                    error={errors.productname}
                    columnTitle={''}
                    password={undefined}
                    value={inputs.productname.toString()}
                    onChangeText={function (text: any): void {
                        console.log("onChangeText : " + text)
                        handleOnchange(text, 'productname')
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
                    value={inputs.price.toString()}
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
                    value={inputs.stock.toString()}
                    onChangeText={function (text: any): void {
                        console.log("onChangeText : " + text)
                        handleOnchange(text, 'stock')
                    }}
                />
                <TouchableOpacity
                    onPress={() => {
                        console.log("Kaydet Test : "+JSON.stringify(inputs));
                        register();
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

export default NewProduct


