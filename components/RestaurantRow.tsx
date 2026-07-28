import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from './RestaurantCardSimple';
import { supperClub } from '../theme/supperClub';
import { spacing, radius } from '../theme';

interface RestaurantRowProps {
  restaurant: Restaurant;
  onPress: () => void;
}

/**
 * Compact list row for the results list (Supper Club direction). Tapping the
 * row opens the detail modal via the parent's onPress. Photos are real Yelp
 * images; no gradients — flat warm fills only.
 */
export const RestaurantRow: React.FC<RestaurantRowProps> = ({ restaurant, onPress }) => (
  <Pressable
    onPress={onPress}
    testID={`restaurant-card-${restaurant.id}`}
    accessibilityRole="button"
    accessibilityLabel={`${restaurant.name}, ${restaurant.rating.toFixed(1)} stars`}
    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
  >
    <Image source={{ uri: restaurant.imageUrl }} style={styles.thumb} />
    <View style={styles.mid}>
      <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
      <Text style={styles.cat} numberOfLines={1}>
        {restaurant.categories.length > 0 ? restaurant.categories.join(' · ') : 'Restaurant'}
      </Text>
    </View>
    <View style={styles.right}>
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={12} color={supperClub.gold} />
        <Text style={styles.rt}>{restaurant.rating.toFixed(1)}</Text>
      </View>
      <Text style={styles.sub}>
        {restaurant.distance.toFixed(1)} mi{restaurant.price ? ` · ${restaurant.price}` : ''}
      </Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: supperClub.borderSoft,
  },
  pressed: { opacity: 0.7 },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: supperClub.surface,
  },
  mid: { flex: 1, minWidth: 0 },
  name: { fontFamily: 'Georgia', fontSize: 15, color: '#FFFFFF' },
  cat: { fontSize: 11, color: supperClub.textMuted, marginTop: 1 },
  right: { alignItems: 'flex-end' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rt: { fontSize: 13, fontWeight: '700', color: supperClub.gold },
  sub: { fontSize: 11, color: supperClub.textMuted, marginTop: 1 },
});
