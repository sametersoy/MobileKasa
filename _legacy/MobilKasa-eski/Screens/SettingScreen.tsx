import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import react, { useState } from 'react';
import { Text, View, Switch, StyleSheet, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

let CamStatus:boolean;
let CamSetting:string | null;


let SoundStatus:boolean;
let SoundSetting:string | null;
 function SettingScreen(): JSX.Element {
    let CamTextFront:string="Ön" 
    let CamTextBack:string="Arka" 
    const [isEnabledCam, setIsEnabledCam] = useState(CamStatus);
    const [isEnabledSound, setIsEnabledSound] = useState(SoundStatus);

    React.useEffect(() => {
         async function CamSetControl(){
             CamSetting = await AsyncStorage.getItem('CamSetting').then((d) => d);
             if(CamSetting == 'B'){
             console.log('camSetting : '+CamSetting);
             CamStatus = true;
             setIsEnabledCam(CamStatus)
             }
             if(CamSetting == 'F'){
               console.log('camSetting else : '+CamSetting);
               CamStatus = false;
               setIsEnabledCam(CamStatus)
               console.log('CamStatus else : '+CamStatus);
             }
           }
           CamSetControl() 

           async function SoundSetControl(){
            SoundSetting = await AsyncStorage.getItem('SoundSetting').then((d) => d);
            if(SoundSetting == 'A'){
            console.log('SoundSetting : '+SoundSetting);
            SoundStatus = true;
            setIsEnabledSound(SoundStatus)
            }
            if(SoundSetting == 'K'){
              SoundStatus = false;
              setIsEnabledSound(SoundStatus)
            }
          }
          SoundSetControl()
      }, [isEnabledCam,isEnabledSound]);
    async function toggleSwitchCam() {
        console.log('toggleSwitchCam');
        
        if(isEnabledCam == true){
            await AsyncStorage.setItem('CamSetting','F');
            setIsEnabledCam(false)
            CamStatus=false;
        }
        if(isEnabledCam == false){
            await AsyncStorage.setItem('CamSetting','B');
            setIsEnabledCam(true)
            CamStatus=true;
        }
    }

    async function toggleSwitchSound() {
        console.log('toggleSwitchSound');
        
        if(isEnabledSound == true){
            await AsyncStorage.setItem('SoundSetting','K');
            setIsEnabledSound(false)
            SoundStatus=false;
        }
        if(isEnabledSound == false){
            await AsyncStorage.setItem('SoundSetting','A');
            setIsEnabledSound(true)
            SoundStatus=true;
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.camSetting}>
                <Text style={{fontSize:20}}>Kamera Ayarı : </Text>
                <View style={styles.camswitch}>
                <Text style={{fontSize:20}}> {isEnabledCam ? CamTextFront : CamTextBack } </Text>
                <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isEnabledCam ? '#f5dd4b' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleSwitchCam}
                    value={isEnabledCam}
                />
                </View>
            </View>
            <View style={styles.soundSetting}>
                <Text style={{fontSize:20}}>Barkod Okuma Sesi : </Text>
                <View style={styles.soundswitch}>
                <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isEnabledSound ? '#f5dd4b' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleSwitchSound}
                    value={isEnabledSound}
                />
                </View>
            </View>
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camSetting: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        with: width,
        flexWrap: 'wrap',
        margin: 20,
        borderRadius:15,
        borderColor:'red',
    },
    camswitch:{
        flexDirection: 'row',
        alignItems: 'center',
    },
    soundSetting: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        with: width,
        flexWrap: 'wrap',
        margin: 20,
        borderRadius:15,
        borderColor:'red',
    },
    soundswitch:{
        flexDirection: 'row',
        alignItems: 'center',
    }

});
export default SettingScreen;