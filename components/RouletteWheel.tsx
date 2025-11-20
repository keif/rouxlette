import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../theme';

interface RouletteWheelProps {
  onSpin: () => void;
  disabled?: boolean;
  size?: number;
  isAutoSpinning?: boolean;
  onAutoSpinComplete?: () => void;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  onSpin,
  disabled = false,
  size = 180,
  isAutoSpinning = false,
  onAutoSpinComplete,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isSpinning, setIsSpinning] = useState(false);

  // Handle auto-spinning triggered by parent
  useEffect(() => {
    if (isAutoSpinning && !isSpinning) {
      setIsSpinning(true);
      spinAnim.setValue(0);

      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }).start(async () => {
        // Success haptic
        if (Platform.OS === 'ios') {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
        }

        setIsSpinning(false);
        spinAnim.setValue(0);

        if (onAutoSpinComplete) {
          onAutoSpinComplete();
        }
      });
    }
  }, [isAutoSpinning]);

  const handlePress = async () => {
    if (disabled || isSpinning) return;

    // Haptic feedback on press
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Spin animation
    setIsSpinning(true);
    spinAnim.setValue(0);

    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: true,
    }).start(async () => {
      // Success haptic
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }

      setIsSpinning(false);
      spinAnim.setValue(0);
      onSpin();
    });
  };

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1800deg'], // 5 full rotations
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Pressable
          onPress={handlePress}
          disabled={disabled || isSpinning}
          style={({ pressed }) => [
            styles.wheel,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            disabled && styles.wheelDisabled,
            pressed && !disabled && styles.wheelPressed,
          ]}
        >
          <Animated.View
            style={{
              transform: [{ rotate: rotation }],
            }}
          >
            <Ionicons
              name="sync-circle"
              size={size * 0.35}
              color={disabled ? colors.gray400 : colors.white}
            />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheel: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  wheelDisabled: {
    backgroundColor: colors.gray300,
  },
  wheelPressed: {
    opacity: 0.9,
  },
});
