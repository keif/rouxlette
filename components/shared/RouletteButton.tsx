import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../Themed';
import AppStyles from '../../AppStyles';

interface RouletteButtonProps {
  onSpin: () => void;
  disabled?: boolean;
}

const RouletteButton: React.FC<RouletteButtonProps> = ({ onSpin, disabled = false }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) return;

    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Spin animation
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      // Reset and trigger callback
      spinValue.setValue(0);
      onSpin();
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1800deg'], // 5 full rotations
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.wheelContainer,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        <Pressable
          style={[
            styles.wheel,
            disabled && styles.wheelDisabled,
          ]}
          onPress={handlePress}
          disabled={disabled}
        >
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <Ionicons
              name="sync-circle"
              size={48}
              color={disabled ? AppStyles.color.gray500 : AppStyles.color.white}
            />
          </Animated.View>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>
            SPIN
          </Text>
        </Pressable>
      </Animated.View>
      <Text style={[styles.subtitle, disabled && styles.subtitleDisabled]}>
        {disabled ? "Search for restaurants first" : "Can't decide? Let us pick for you"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 24,
  },
  wheelContainer: {
    // Container for scale animation
  },
  wheel: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: AppStyles.color.primary,
    backgroundColor: AppStyles.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppStyles.shadow.level2,
  },
  wheelDisabled: {
    borderColor: AppStyles.color.gray300,
    backgroundColor: AppStyles.color.gray300,
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    ...AppStyles.typography.subhead,
    fontWeight: '600',
    color: AppStyles.color.white,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  labelDisabled: {
    color: AppStyles.color.gray500,
  },
  subtitle: {
    ...AppStyles.typography.callout,
    color: AppStyles.color.gray700,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 280,
  },
  subtitleDisabled: {
    color: AppStyles.color.gray500,
  },
});

export default RouletteButton;
