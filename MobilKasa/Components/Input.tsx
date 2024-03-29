import React, { FC } from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import COLORS from './Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  value:string
  placeholder:string
  label:string
  iconName: string
  columnTitle: string
  error?: any
  password:any
  onFocus:()=>void
  onChangeText:(text: any)=>void
}

const Input: FC<Props> = ({
  value,
  label,
  iconName,
  error,
  password,
  onFocus = () => {},
  ...props
}) => {
  const [hidePassword, setHidePassword] = React.useState(password);
  const [isFocused, setIsFocused] = React.useState(false);
  return (
    <View style={{marginBottom: 7}}>
      <Text style={style.label}>{label}</Text>
      <View
        style={[
          style.inputContainer,
          {
            borderColor: error
              ? COLORS.red
              : isFocused
              ? COLORS.darkBlue
              : COLORS.light,
            alignItems: 'center',
          },
        ]}>
        <Icon
          name={iconName}
          style={{color: COLORS.darkBlue, fontSize: 22, marginRight: 10}}
        />
        <TextInput
          value={value}
          autoCorrect={false}
          onFocus={() => {
            onFocus();
            setIsFocused(true);
          }}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={hidePassword}
          style={{color: COLORS.darkBlue, flex: 1}}
          {...props}
        />
        {password && (
          <Icon
            onPress={() => setHidePassword(!hidePassword)}
            name={hidePassword ? 'eye-outline' : 'eye-off-outline'}
            style={{color: COLORS.darkBlue, fontSize: 22}}
          />
        )}
      </View>
      {error && (
        <Text style={{marginTop: 7, color: COLORS.red, fontSize: 12}}>
          {error}
        </Text>
      )}
    </View>
  );
};

const style = StyleSheet.create({
  label: {
    marginVertical: 5,
    fontSize: 12,
    color: COLORS.grey,
  },
  inputContainer: {
    //height: 45,
    backgroundColor: COLORS.light,
    flexDirection: 'row',
    paddingHorizontal: 15,
    borderWidth: 0.3,
  },
});

export default Input;

