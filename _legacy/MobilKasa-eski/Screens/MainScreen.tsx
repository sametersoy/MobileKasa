import react, { useEffect } from 'react'
import { Text, Button, View, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, Animated, } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux'
import { decrement, increment } from '../Redux/reducers/counterSlice'
import { RootState } from '../Redux/Store';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;



export function MainScreen(props: any): JSX.Element {
    const count = useSelector((state: RootState) => state.counter.value)
    const dispatch = useDispatch()
    console.log(count)



    const shopAnim = react.useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
    const shopAnimRotating = shopAnim.interpolate({
        inputRange: [0, 30],
        outputRange: [Math.floor(Math.random() * 50) + 15 + 'deg', '0deg'],
    });
    const stockAnim = react.useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
    const stockAnimRotating = stockAnim.interpolate({
        inputRange: [0, 30],
        outputRange: [Math.floor(Math.random() * 50) + 15 + 'deg', '0deg'],
    });

    useEffect(() => {
        Animated.timing(shopAnim, {
            toValue: 30,
            duration: Math.floor(Math.random() * 100) + 700,
            delay: Math.floor(Math.random() * 500) + 200,
            useNativeDriver: true
        }).start();
        Animated.timing(stockAnim, {
            toValue: 30,
            duration: Math.floor(Math.random() * 100) + 700,
            delay: Math.floor(Math.random() * 500) + 200,
            useNativeDriver: true
        }).start();
    }, [shopAnim]);

    return (<SafeAreaView style={styles.container}>
        <View style={styles.container} >
            <Animated.View style={{
                width: '100%',
                height: height / 3,
                transform: [
                    { rotateY: shopAnimRotating },
                ],
            }}>
                <View style={styles.content1}>
                    <TouchableOpacity
                        onPress={() => {
                            props.navigation.navigate("Kasa")
                            dispatch(increment())
                        }}>
                        <Icon name="add-shopping-cart" size={100} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 28, alignSelf: 'center' }}>KASA</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
            <View style={styles.concontent}>
                <Animated.View style={{
                    width: '50%',
                    height: height / 3,
                    transform: [
                        { rotateY: shopAnimRotating },
                    ],
                }}>
                    <View style={styles.content2}>
                        <TouchableOpacity
                            onPress={() => props.navigation.navigate("Stok")}>
                            <Icon name="storage" size={100} color="white" />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 28, alignSelf: 'center' }}>STOK</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
                <Animated.View style={{
                    width: '50%',
                    height: height / 3,
                    transform: [
                        { rotateY: shopAnimRotating },
                    ],
                }}>
                    <View style={styles.content4}>
                        <TouchableOpacity
                            onPress={() => props.navigation.navigate("Order")}>
                            <Icon name="border-color" size={100} color="white" />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 28, alignSelf: 'center' }}>SATIŞLAR</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

            </View>
            <Animated.View style={{
                width: '100%',
                height: height / 3,
                transform: [
                    { rotateY: shopAnimRotating },
                ],
            }}>
                <View style={styles.content3}>
                    <TouchableOpacity
                        onPress={() => props.navigation.navigate("Setting")}>
                        <Icon name="settings" size={100} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 28, alignSelf: 'center' }}>AYARLAR</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

        </View>
    </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        height: height
    },
    content1: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        height: height / 3,

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
        width: width / 2,
        backgroundColor: 'blue',
        height: height / 3
    },
    content4: {
        flexDirection: 'column',
        backgroundColor: 'purple',
        justifyContent: 'center',
        alignItems: 'center',
        width: width / 2,
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


export default MainScreen