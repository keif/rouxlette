import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

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
      <View style={styles.actionButtons}>
        {/* Block Button */}
        <Pressable
          onPress={onBlockToggle}
          style={styles.actionButton}
          hitSlop={8}
        >
          <MaterialIcons
            name="block"
            size={24}
            color={restaurant.isBlocked ? '#ff4444' : colors.white}
          />
        </Pressable>

        {/* Favorite Button */}
        <Pressable
          onPress={onFavoriteToggle}
          style={styles.actionButton}
          hitSlop={8}
        >
          <Ionicons
            name={restaurant.isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={restaurant.isFavorite ? colors.error : colors.white}
          />
        </Pressable>
      </View>

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
            <Ionicons name="star" size={14} color={colors.warning} />
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
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
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
    backgroundColor: colors.gray200,
  },
  actionButtons: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: radius.full,
    padding: spacing.sm,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    ...typography.headline,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.footnote,
    color: colors.gray900,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    ...typography.footnote,
    color: colors.gray600,
    marginLeft: 2,
  },
  divider: {
    ...typography.footnote,
    color: colors.gray400,
    marginHorizontal: spacing.xs,
  },
  price: {
    ...typography.footnote,
    color: colors.gray700,
    fontWeight: '600',
  },
  distance: {
    ...typography.footnote,
    color: colors.gray600,
  },
  categories: {
    ...typography.caption1,
    color: colors.gray600,
  },
});
