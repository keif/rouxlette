import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActionButtons from './shared/ActionButtons';
import AppStyles from '../AppStyles';

export interface Restaurant {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  price: string;
  distance: number;
  categories: string[];
  isFavorite?: boolean;
  isBlocked?: boolean;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  onFavoriteToggle: () => void;
  onBlockToggle: () => void;
}

export const RestaurantCardSimple: React.FC<RestaurantCardProps> = ({
  restaurant,
  onPress,
  onFavoriteToggle,
  onBlockToggle,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Hero Image */}
      <Image
        source={{ uri: restaurant.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Action Buttons */}
      <ActionButtons
        isBlocked={restaurant.isBlocked ?? false}
        isFavorite={restaurant.isFavorite ?? false}
        onBlockPress={onBlockToggle}
        onFavoritePress={onFavoriteToggle}
        style={styles.actionButtons}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>

        {/* Metadata Row */}
        <View style={styles.metadata}>
          {/* Rating */}
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color={AppStyles.color.warning} />
            <Text style={styles.ratingText}>
              {restaurant.rating.toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({restaurant.reviewCount})
            </Text>
          </View>

          {/* Divider */}
          <Text style={styles.divider}>•</Text>

          {/* Price */}
          <Text style={styles.price}>{restaurant.price}</Text>

          {/* Divider */}
          <Text style={styles.divider}>•</Text>

          {/* Distance */}
          <Text style={styles.distance}>
            {restaurant.distance.toFixed(1)} mi
          </Text>
        </View>

        {/* Categories */}
        <Text style={styles.categories} numberOfLines={1}>
          {restaurant.categories.join(' • ')}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppStyles.color.white,
    borderRadius: AppStyles.radius.l,
    marginHorizontal: AppStyles.spacing.m,
    marginBottom: AppStyles.spacing.m,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: AppStyles.color.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardPressed: {
    opacity: 0.95,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: AppStyles.color.gray100,
  },
  actionButtons: {
    position: 'absolute',
    top: AppStyles.spacing.m,
    right: AppStyles.spacing.m,
  },
  content: {
    padding: AppStyles.spacing.m,
  },
  name: {
    ...AppStyles.typography.headline,
    color: AppStyles.color.gray900,
    marginBottom: AppStyles.spacing.xs,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppStyles.spacing.xs,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...AppStyles.typography.footnote,
    color: AppStyles.color.gray900,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    ...AppStyles.typography.footnote,
    color: AppStyles.color.gray500,
    marginLeft: 2,
  },
  divider: {
    ...AppStyles.typography.footnote,
    color: AppStyles.color.gray300,
    marginHorizontal: AppStyles.spacing.xs,
  },
  price: {
    ...AppStyles.typography.footnote,
    color: AppStyles.color.gray700,
    fontWeight: '600',
  },
  distance: {
    ...AppStyles.typography.footnote,
    color: AppStyles.color.gray500,
  },
  categories: {
    ...AppStyles.typography.caption1,
    color: AppStyles.color.gray500,
  },
});
