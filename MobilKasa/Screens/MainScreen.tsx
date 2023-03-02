import react from 'react'
import { Text, Button, View, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons';
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
export function MainScreen(props: any): JSX.Element {
    return (<SafeAreaView style={styles.container}>
        <View style={styles.container} >
            <View style={styles.content1}>
                <TouchableOpacity
                    onPress={() => props.navigation.navigate("Kasa")}>
                    <Icon name="add-shopping-cart" size={100} color="white" />
                    <Text style={{color:'white', fontWeight:'bold', fontSize:28, alignSelf:'center'}}>KASA</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.concontent}>
           <View style={styles.content2}>
                    <TouchableOpacity 
                        onPress={() => props.navigation.navigate("Stok")}>
                        <Icon name="storage" size={100} color="white" />
                        <Text style={{color:'white',fontWeight:'bold', fontSize:28, alignSelf:'center'}}>STOK</Text>
                    </TouchableOpacity>
            </View>
            <View style={styles.content4}>
                    <TouchableOpacity 
                        onPress={() => props.navigation.navigate("Order")}>
                        <Icon name="border-color" size={100} color="white" />
                        <Text style={{color:'white',fontWeight:'bold', fontSize:28, alignSelf:'center'}}>SATIŞLAR</Text>
                    </TouchableOpacity>
            </View>
            </View>
            <View style={styles.content3}>
                <TouchableOpacity
                    onPress={() => props.navigation.navigate("Setting")}>
                    <Icon name="settings" size={100} color="white" />
                    <Text style={{color:'white',fontWeight:'bold', fontSize:28, alignSelf:'center'}}>AYARLAR</Text>
                </TouchableOpacity>
            </View>

        </View>
    </SafeAreaView>
    )
}

export default MainScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'grey',
        height: height
    },
    content1: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        height: height / 3
    },
    concontent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    content2: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width:width/2,
        backgroundColor: 'blue',
        height: height / 3
    },
    content4:{
        flexDirection: 'column',
        backgroundColor: 'purple',
        justifyContent: 'center',
        alignItems: 'center',
        width:width/2,
        height: height / 3

    },
    content3: {
        flexDirection: 'row',
        backgroundColor: 'orange',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: height / 3
    },
   
})