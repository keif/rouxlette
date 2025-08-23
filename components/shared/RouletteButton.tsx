import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { View } from '../Themed';
import AppStyles from '../../AppStyles';

interface RouletteButtonProps {
  onSpin: () => void;
  disabled?: boolean;
}

const RouletteButton: React.FC<RouletteButtonProps> = ({ onSpin, disabled = false }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (disabled) return;
    
    // Animate the spin
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      // Reset animation and trigger callback
      spinValue.setValue(0);
      onSpin();
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1440deg'], // 4 full rotations
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.rouletteWheel,
          { transform: [{ rotate: spin }] },
          disabled && styles.disabled,
        ]}
      >
        <Pressable
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={handlePress}
          disabled={disabled}
        >
          <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
            🎰
          </Text>
          <Text style={[styles.buttonLabel, disabled && styles.buttonTextDisabled]}>
            SPIN THE WHEEL
          </Text>
        </Pressable>
      </Animated.View>
      <Text style={styles.subtitle}>
        {disabled ? "Search for restaurants first!" : "Can't decide? Let us pick for you!"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 32,
  },
  rouletteWheel: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: AppStyles.color.roulette.gold,
    backgroundColor: AppStyles.color.roulette.red,
    shadowColor: AppStyles.color.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 92,
    margin: 4,
    backgroundColor: AppStyles.color.roulette.gold,
  },
  buttonDisabled: {
    backgroundColor: AppStyles.color.greylight,
    borderColor: AppStyles.color.greylight,
  },
  disabled: {
    borderColor: AppStyles.color.greylight,
    backgroundColor: AppStyles.color.greylight,
  },
  buttonText: {
    fontSize: 40,
    marginBottom: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
  buttonTextDisabled: {
    color: AppStyles.color.greydark,
  },
  subtitle: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default RouletteButton;