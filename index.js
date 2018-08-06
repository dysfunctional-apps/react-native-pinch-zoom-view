import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  PanResponder,
  ViewPropTypes,
  Dimensions
} from 'react-native';

// Fallback when RN version is < 0.44
const viewPropTypes = ViewPropTypes || View.propTypes;

export default class PinchZoomView extends Component {

  static propTypes = {
    ...viewPropTypes,
    scalable: PropTypes.bool,
    minScale:PropTypes.number,
    maxScale:PropTypes.number
  };

  static defaultProps = {
    scalable: true,
    minScale:1,
    maxScale:2
  };

  constructor(props) {
    super(props);
    this.state = {
      scale: 1,
      lastScale: 1,
      offsetX: 0,
      offsetY: 0,
      lastX: 0,
      lastY: 0
    },
    this.distant = 150;
  }

  componentWillMount() {
    this.gestureHandlers = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminationRequest: evt => true,
      onShouldBlockNativeResponder: evt => false
    });
  }

  _handleStartShouldSetPanResponder = (e, gestureState) => {
    // don't respond to single touch to avoid shielding click on child components
    return false;
  }

  _handleMoveShouldSetPanResponder = (e, gestureState) => {
    return this.props.scalable 
      && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2 || gestureState.numberActiveTouches === 2);
  }

  _handlePanResponderGrant = (e, gestureState) => {
    if (gestureState.numberActiveTouches === 2) {
      let dx = Math.abs(e.nativeEvent.touches[0].pageX - e.nativeEvent.touches[1].pageX);
      let dy = Math.abs(e.nativeEvent.touches[0].pageY - e.nativeEvent.touches[1].pageY);
      let distant = Math.sqrt(dx * dx + dy * dy);
      this.distant = distant;
    }
  }

  _handlePanResponderEnd = (e, gestureState) => {
    this.setState({
      lastX: this.state.offsetX, 
      lastY: this.state.offsetY, 
      lastScale: this.state.scale
    });
  }

  _handlePanResponderMove = (e, gestureState) => {    
    // zoom
    if (gestureState.numberActiveTouches === 2) {
      let dx = Math.abs(e.nativeEvent.touches[0].pageX - e.nativeEvent.touches[1].pageX);
      let dy = Math.abs(e.nativeEvent.touches[0].pageY - e.nativeEvent.touches[1].pageY);
      let distant = Math.sqrt(dx * dx + dy * dy);
      let scale = distant / this.distant * this.state.lastScale;
      
      if ( scale < this.props.maxScale  && scale > this.props.minScale ){
        this.setState({ scale });
      }
    }
    // translate
    else if (gestureState.numberActiveTouches === 1 && this.state.scale !== 1) {
      let offsetX = this.state.lastX + gestureState.dx / this.state.scale;
      let offsetY = this.state.lastY + gestureState.dy / this.state.scale;
      const { width, height } = Dimensions.get('window')

      const factor = (this.state.scale - 1) / 4

      const maxX = factor * width
      const maxY = factor * height
      
      offsetX = Math.max(Math.min(offsetX, maxX), maxX * -1)      
      offsetY = Math.max(Math.min(offsetY, maxY), maxY * -1)

      this.setState({ offsetX, offsetY });
    }
  }

  render() {
    return (
        <View
          {...this.gestureHandlers.panHandlers}
          style={[styles.container, this.props.style, {
            transform: [
              {scaleX: this.props.scalable ? this.state.scale : 1},
              {scaleY: this.props.scalable ? this.state.scale : 1},
              {translateX: this.props.scalable ? this.state.offsetX : 0},
              {translateY: this.props.scalable ? this.state.offsetY : 0}
            ]
          }]}>
          {this.props.children}
        </View>
    );
  }
}

const styles = StyleSheet.create({
 container: {
    flex: 1,
  }
});
