import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from './RestaurantCardSimple';
import { supperClub, supperClubGlow } from '../theme/supperClub';
import { spacing, radius } from '../theme';

interface RestaurantTopPickProps {
  restaurant: Restaurant;
  onPress: () => void;
  onDirections: () => void;
  onSpinAgain: () => void;
  onFavoriteToggle: () => void;
  /** Defaults to the roulette framing; pass "Top rated" etc. for non-spin contexts. */
  badgeLabel?: string;
}

/**
 * Hero "top pick" card for the results list (Supper Club direction). Flat warm
 * photo, one signature magenta glow (it's the wheel's choice). Tapping the card
 * opens the detail modal; the action buttons act in place.
 */
export const RestaurantTopPick: React.FC<RestaurantTopPickProps> = ({
  restaurant,
  onPress,
  onDirections,
  onSpinAgain,
  onFavoriteToggle,
  badgeLabel = '🎰 The wheel picked',
}) => (
  <Pressable
    onPress={onPress}
    testID={`restaurant-card-${restaurant.id}`}
    accessibilityRole="button"
    accessibilityLabel={`Top pick: ${restaurant.name}`}
    style={({ pressed }) => [styles.card, supperClubGlow.wheel, pressed && styles.pressed]}
  >
    <Image source={{ uri: restaurant.imageUrl }} style={styles.image} />

    <View style={styles.badge}>
      <Text style={styles.badgeText}>{badgeLabel}</Text>
    </View>

    <Pressable
      onPress={onFavoriteToggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={restaurant.isFavorite ? 'Remove favorite' : 'Add favorite'}
      style={styles.heart}
    >
      <Ionicons
        name={restaurant.isFavorite ? 'heart' : 'heart-outline'}
        size={16}
        color={supperClub.gold}
      />
    </Pressable>

    <View style={styles.panel}>
      <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
      <View style={styles.meta}>
        <Ionicons name="star" size={13} color={supperClub.gold} />
        <Text style={styles.metaText}>
          {restaurant.rating.toFixed(1)} · {restaurant.price || '—'} · {restaurant.distance.toFixed(1)} mi
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onDirections} style={[styles.act, styles.actPrimary]} accessibilityRole="button">
          <Text style={styles.actPrimaryText}>Directions</Text>
        </Pressable>
        <Pressable onPress={onSpinAgain} style={[styles.act, styles.actSecondary]} accessibilityRole="button">
          <Text style={styles.actSecondaryText}>Spin again ↻</Text>
        </Pressable>
      </View>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    height: 176,
    marginBottom: spacing.md,
    backgroundColor: supperClub.surface,
  },
  pressed: { opacity: 0.94 },
  image: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  badge: {
    position: 'absolute',
    top: 11,
    left: 11,
    backgroundColor: supperClub.gold,
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#1A1013',
  },
  heart: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(10,6,8,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(10,6,8,0.62)',
  },
  name: { fontFamily: 'Georgia', fontSize: 20, color: '#FFFFFF' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  metaText: { fontSize: 12, color: supperClub.text },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  act: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full },
  actPrimary: { backgroundColor: supperClub.gold },
  actPrimaryText: { fontSize: 11, fontWeight: '700', color: '#1A1013' },
  actSecondary: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' },
  actSecondaryText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
});
