import react from 'react'
import { Text, Button, View, SafeAreaView, StyleSheet, TouchableOpacity, } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons';

export function MainScreen(props: any): JSX.Element {
    return (<SafeAreaView style={styles.container}>
        <View style={styles.container} >
            <View style={styles.content1}>
                <TouchableOpacity style={styles.content1}
                    onPress={() => props.navigation.navigate("Kasa")}>
                    <Icon name="add-shopping-cart" size={100} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => props.navigation.navigate("Kasa")}>
                </TouchableOpacity>
            </View>
            <View style={styles.content2}>
                <TouchableOpacity
                    onPress={() => props.navigation.navigate("Kasa")}>
                    <Icon name="storage" size={100} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => props.navigation.navigate("Kasa")}>
                </TouchableOpacity>
            </View>
            <View style={styles.content3}>
                <TouchableOpacity
                    onPress={() => props.navigation.navigate("Kasa")}>
                    <Icon name="settings" size={100} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => props.navigation.navigate("Kasa")}>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                onPress={() => props.navigation.navigate("Kasa")}>
            </TouchableOpacity>


        </View>
    </SafeAreaView>
    )
}

export default MainScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'grey',
        //alignItems: 'center'
    },
    content1: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        
    },
    content2: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'blue',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content3: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'orange',
        justifyContent: 'center',
        alignItems: 'center',
    },
})