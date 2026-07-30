import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G } from 'react-native-svg';
import {
  supperClub,
  supperClubPalette,
  supperClubWheelSegments,
  supperClubGlow,
} from '../theme/supperClub';

interface RouletteWheelProps {
  onSpin: () => void;
  disabled?: boolean;
  size?: number;
  isAutoSpinning?: boolean;
  onAutoSpinComplete?: () => void;
}

// Precompute the 8 pie wedges once (viewBox is 100x100, so it scales to any size).
const VIEWBOX = 100;
const R = 50;
const C = 50;
const SEGMENTS = supperClubWheelSegments.length;
const SWEEP = 360 / SEGMENTS;

const polar = (deg: number): [number, number] => {
  // -90 so segment 0 starts at the top (under the pointer).
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + R * Math.cos(rad), C + R * Math.sin(rad)];
};

const WEDGES = supperClubWheelSegments.map((color, i) => {
  const [x0, y0] = polar(i * SWEEP);
  const [x1, y1] = polar((i + 1) * SWEEP);
  return {
    color,
    d: `M${C},${C} L${x0.toFixed(3)},${y0.toFixed(3)} A${R},${R} 0 0 1 ${x1.toFixed(3)},${y1.toFixed(3)} Z`,
  };
});

// Add ~33% alpha so disabled wedges read muted (RN honors 8-digit hex).
const muted = (hex: string): string => hex + '55';

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  onSpin,
  disabled = false,
  size = 200,
  isAutoSpinning = false,
  onAutoSpinComplete,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isSpinning, setIsSpinning] = useState(false);

  const runSpin = (onDone?: () => void) => {
    setIsSpinning(true);
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      spinAnim.setValue(0);
      onDone?.();
    });
  };

  // Auto-spin triggered by the parent (e.g. after a search resolves).
  useEffect(() => {
    if (isAutoSpinning && !isSpinning) {
      runSpin(onAutoSpinComplete);
    }
  }, [isAutoSpinning]);

  const handlePress = () => {
    if (disabled || isSpinning) return;

    // NOTE: expo-haptics was removed here — on iOS 26 (iPhone 17) the CoreHaptics
    // call threw an Obj-C exception that React Native's New-Arch TurboModule
    // bridge rethrew uncaught, aborting the app (SIGABRT) the instant spin was
    // tapped. A JS try/catch can't catch a native abort, so the call is gone.
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    runSpin(onSpin);
  };

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1800deg'], // 5 full rotations
  });

  const pointerSize = size * 0.09;
  const hubSize = size * 0.3;

  return (
    <View style={styles.container}>
      <Animated.View style={{ width: size, height: size, transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={handlePress}
          disabled={disabled || isSpinning}
          accessibilityRole="button"
          accessibilityLabel="Spin the wheel"
          accessibilityState={{ disabled: disabled || isSpinning }}
          style={({ pressed }) => [
            styles.wheel,
            { width: size, height: size, borderRadius: size / 2 },
            !disabled && supperClubGlow.wheel,
            disabled && styles.wheelDisabled,
            pressed && !disabled && styles.wheelPressed,
          ]}
        >
          {/* Rotating segmented disc */}
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
              <G>
                {WEDGES.map((w, i) => (
                  <Path
                    key={i}
                    d={w.d}
                    fill={disabled ? muted(w.color) : w.color}
                    stroke={supperClubPalette.espresso}
                    strokeWidth={0.75}
                  />
                ))}
                <Circle cx={C} cy={C} r={R} fill="none" stroke={supperClub.gold} strokeWidth={1.5} opacity={0.6} />
              </G>
            </Svg>
          </Animated.View>

          {/* Fixed center hub (does not rotate) */}
          <View
            style={[
              styles.hub,
              { width: hubSize, height: hubSize, borderRadius: hubSize / 2 },
              disabled && styles.hubDisabled,
            ]}
          >
            <Ionicons
              name="restaurant"
              size={hubSize * 0.5}
              color={disabled ? supperClub.textMuted : supperClub.gold}
            />
          </View>
        </Pressable>

        {/* Fixed gold pointer at the top (decorative — let taps reach the wheel) */}
        <View
          pointerEvents="none"
          style={[
            styles.pointer,
            {
              borderLeftWidth: pointerSize,
              borderRightWidth: pointerSize,
              borderTopWidth: pointerSize * 1.4,
              marginLeft: -pointerSize,
            },
            disabled && styles.pointerDisabled,
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  wheel: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: supperClubPalette.espresso,
  },
  wheelDisabled: { opacity: 0.5 },
  wheelPressed: { opacity: 0.92 },
  hub: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: supperClubPalette.espresso,
    borderWidth: 2,
    borderColor: supperClub.gold,
  },
  hubDisabled: { borderColor: supperClub.textMuted },
  pointer: {
    position: 'absolute',
    top: -2,
    left: '50%',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: supperClub.gold,
    zIndex: 3,
  },
  pointerDisabled: { borderTopColor: supperClub.textMuted },
});
