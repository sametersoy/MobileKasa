import PropTypes from 'prop-types';
import { StyleSheet, View } from 'react-native';

const CustomView = ({ currentMessage = {}, containerStyle = {}, mapViewStyle = {} }) => {
  const { location } = currentMessage;

  if (location) {
    return (
      <View style={[styles.container, containerStyle]}>
        <View style={[styles.mapView, mapViewStyle, { backgroundColor: '#e0e0e0' }]} />
      </View>
    );
  }
  return null;
};

const styles = StyleSheet.create({
  container: {},
  mapView: {
    width: 150,
    height: 100,
    borderRadius: 13,
    margin: 3,
  },
});

CustomView.propTypes = {
  currentMessage: PropTypes.object,
  containerStyle: PropTypes.object,
  mapViewStyle: PropTypes.object,
};

export default CustomView;
