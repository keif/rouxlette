import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AppStyles from '../../AppStyles';

interface ActionButtonsProps {
  isBlocked: boolean;
  isFavorite: boolean;
  onBlockPress: () => void;
  onFavoritePress: () => void;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

/**
 * Shared Block/Favorite action buttons for restaurant cards
 *
 * Used by:
 * - RestaurantCardSimple (SearchScreen)
 * - RestaurantCardDetailed (ResultsList)
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isBlocked,
  isFavorite,
  onBlockPress,
  onFavoritePress,
  size = 'medium',
  style,
}) => {
  const iconSize = size === 'small' ? 20 : 24;
  const buttonStyle = size === 'small' ? styles.buttonSmall : styles.button;

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={buttonStyle}
        onPress={onBlockPress}
        hitSlop={8}
        android_ripple={{
          color: 'rgba(255,255,255,0.3)',
          radius: size === 'small' ? 16 : 20,
          borderless: true,
        }}
        accessibilityLabel={isBlocked ? 'Remove from block list' : 'Block this restaurant'}
        accessibilityRole="button"
      >
        <MaterialIcons
          name="block"
          size={iconSize}
          color={isBlocked ? '#ff4444' : AppStyles.color.white}
          style={styles.iconShadow}
        />
      </Pressable>

      <Pressable
        style={buttonStyle}
        onPress={onFavoritePress}
        hitSlop={8}
        android_ripple={{
          color: 'rgba(255,255,255,0.3)',
          radius: size === 'small' ? 16 : 20,
          borderless: true,
        }}
        accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        accessibilityRole="button"
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={iconSize}
          color={isFavorite ? AppStyles.color.yelp : AppStyles.color.white}
          style={styles.iconShadow}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSmall: {
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconShadow: {
    textShadowColor: AppStyles.color.black,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});

export default ActionButtons;
