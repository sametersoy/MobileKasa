import PropTypes from 'prop-types';
import { Image as RNImage, StyleSheet } from 'react-native';

const Image = (props) => {
  const { style = {}, resizeMode = 'cover', ...rest } = props;
  return <RNImage style={StyleSheet.flatten([style && style])} {...rest} resizeMode={resizeMode} />;
};

Image.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default Image;
