import react from "react";
import { Text } from "react-native";

export function  LogoTitle(props:any): JSX.Element {
    return(
        <Text style={{fontSize:20,fontWeight:'bold', justifyContent:'flex-end', alignItems:'flex-end',flex:1,alignSelf:'flex-end', flexDirection:'row'}}>Kasa</Text>
    )
}

export default LogoTitle