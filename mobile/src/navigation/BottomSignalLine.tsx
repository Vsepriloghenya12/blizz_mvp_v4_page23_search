import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const SIGNAL_WIDTH = 48;
const SIGNAL_HEIGHT = 9;
const DIVIDER_COLOR = "#D9E3F2";

interface BottomSignalLineProps {
  activeIndex: number;
  itemCount: number;
  width: number;
  reducedMotion: boolean;
}

export function BottomSignalLine({
  activeIndex,
  itemCount,
  width,
  reducedMotion,
}: BottomSignalLineProps) {
  const position = useRef(new Animated.Value(0)).current;
  const initialized = useRef(false);
  const previousWidth = useRef(0);
  const animationGeneration = useRef(0);

  useEffect(() => {
    if (width <= 0 || itemCount <= 0) return;

    const target =
      (width / itemCount) * (activeIndex + 0.5) - SIGNAL_WIDTH / 2;
    const widthChanged = previousWidth.current !== width;
    previousWidth.current = width;
    const generation = animationGeneration.current + 1;
    animationGeneration.current = generation;

    if (!initialized.current || widthChanged || reducedMotion) {
      position.stopAnimation();
      position.setValue(target);
      initialized.current = true;
      return;
    }

    position.stopAnimation((currentValue) => {
      if (animationGeneration.current !== generation) return;
      position.setValue(currentValue);
      Animated.timing(position, {
        duration: 240,
        easing: Easing.inOut(Easing.cubic),
        toValue: target,
        useNativeDriver: false,
      }).start();
    });
  }, [activeIndex, itemCount, position, reducedMotion, width]);

  const curveDepth = activeIndex === 2 ? 7 : 5;

  return (
    <View pointerEvents="none" style={styles.container}>
      {width > 0 ? (
        <>
          <Animated.View style={[styles.surfaceSegment, styles.leftSurface, { width: position }]} />
          <Animated.View style={[styles.surfaceSegment, styles.rightSurface, { left: Animated.add(position, SIGNAL_WIDTH) }]} />
          <Animated.View style={[styles.divider, styles.leftDivider, { width: position }]} />
          <Animated.View style={[styles.divider, styles.rightDivider, { left: Animated.add(position, SIGNAL_WIDTH) }]} />
          <Animated.View style={[styles.signal, { transform: [{ translateX: position }] }]}>
            <Svg height={SIGNAL_HEIGHT} viewBox="0 0 48 9" width={SIGNAL_WIDTH}>
              <Path
                d={`M0 1 C12 1 12 ${curveDepth} 24 ${curveDepth} C36 ${curveDepth} 36 1 48 1 L48 9 L0 9 Z`}
                fill="#FFFFFF"
                stroke="none"
              />
              <Path
                d={`M0 1 C12 1 12 ${curveDepth} 24 ${curveDepth} C36 ${curveDepth} 36 1 48 1`}
                fill="none"
                stroke={DIVIDER_COLOR}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
              />
            </Svg>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SIGNAL_HEIGHT,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
  },
  divider: {
    backgroundColor: DIVIDER_COLOR,
    height: StyleSheet.hairlineWidth,
    position: "absolute",
    top: 1,
  },
  surfaceSegment: {
    backgroundColor: "#FFFFFF",
    bottom: 0,
    position: "absolute",
    top: 1,
  },
  leftSurface: {
    left: 0,
  },
  rightSurface: {
    right: 0,
  },
  leftDivider: {
    left: 0,
  },
  rightDivider: {
    right: 0,
  },
  signal: {
    height: SIGNAL_HEIGHT,
    left: 0,
    position: "absolute",
    top: 0,
    width: SIGNAL_WIDTH,
  },
});
