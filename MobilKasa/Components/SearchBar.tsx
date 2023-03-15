// SearchBar.js
import React from "react";
import { StyleSheet, TextInput, View, Keyboard, Button } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

interface Props {
  clicked:any, searchPhrase:any, setSearchPhrase:any, setCLicked:any, onChangeText?:any,
}

const SearchBar: React.FC<Props> = ({clicked, searchPhrase, setSearchPhrase, setCLicked,onChangeText}) => {
  console.log("click : "+clicked);
  
  return (
    <View style={styles.container}>
      <View
        style={
          clicked
            ? styles.searchBar__clicked
            : styles.searchBar__unclicked
        }
      >
        {/* search Icon */}
        <Icon
          name="search"
          size={25}
          color="black"
          style={{ marginLeft: 1 }}
        />
        {/* Input field */}
        <TextInput
          style={styles.input}
          placeholder="Ara"
          value={searchPhrase}
          onChangeText={setSearchPhrase}
          onFocus={() => {
            setCLicked(true);
          }}
        />
        {/* cross Icon, depending on whether the search bar is clicked or not */}
        {clicked && (
          <Icon name="close" size={20} color="black" style={{ padding: 1 }} onPress={() => {
              setSearchPhrase("")
          }}/>
        )}
      </View>
      {/* cancel button, depending on whether the search bar is clicked or not */}
      {clicked && (
        <View>
          <Button
            style={{ margin: 10 }}
            title="Cancel"
            onPress={() => {
              Keyboard.dismiss();
              setCLicked(false);
            }}
          ></Button>
        </View>
      )}
    </View>
  );
};
export default SearchBar;

// styles
const styles = StyleSheet.create({
  container: {
    margin: 10,
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    width: "90%",
    height:65,

  },
  searchBar__unclicked: {
    padding: 5,
    flexDirection: "row",
    width: "95%",
    backgroundColor: "#d9dbda",
    borderRadius: 15,
    alignItems: "center",
  },
  searchBar__clicked: {
    padding: 5,
    flexDirection: "row",
    width: "80%",
    backgroundColor: "#d9dbda",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  input: {
    fontSize: 20,
    marginLeft: 10,
    width: "90%",
  },
});