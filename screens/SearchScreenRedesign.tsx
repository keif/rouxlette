import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RestaurantCard, Restaurant } from '../components/RestaurantCard';
import { ActiveFilterBar, ActiveFilter } from '../components/ActiveFilterBar';
import { colors, spacing, radius, typography } from '../theme';

// Dummy data
const DUMMY_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'The Daily Pint',
    imageUrl: 'https://via.placeholder.com/400x300',
    rating: 4.5,
    reviewCount: 234,
    price: '$$',
    distance: 0.3,
    categories: ['Gastropub', 'American'],
    isFavorite: false,
  },
  {
    id: '2',
    name: 'Catalog',
    imageUrl: 'https://via.placeholder.com/400x300',
    rating: 4.8,
    reviewCount: 567,
    price: '$$$',
    distance: 1.2,
    categories: ['New American', 'Cocktail Bars'],
    isFavorite: true,
  },
];

export const SearchScreenRedesign: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('pizza');
  const [location, setLocation] = useState('Columbus, OH');
  const [restaurants, setRestaurants] = useState(DUMMY_RESTAURANTS);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const handleFiltersPress = () => {
    console.log('Open filters modal');
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    console.log('Navigate to details:', restaurant.id);
  };

  const handleFavoriteToggle = (restaurantId: string) => {
    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === restaurantId ? { ...r, isFavorite: !r.isFavorite } : r
      )
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {/* Search Input */}
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search"
            size={20}
            color={colors.gray500}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="What are you craving?"
            placeholderTextColor={colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.gray400} />
            </Pressable>
          )}
        </View>

        {/* Filters Button */}
        <Pressable
          onPress={handleFiltersPress}
          style={({ pressed }) => [
            styles.filtersButton,
            pressed && styles.filtersButtonPressed,
          ]}
        >
          <Ionicons name="options-outline" size={24} color={colors.primary} />
          {activeFilters.length > 0 && (
            <View style={styles.filtersBadge}>
              <Text style={styles.filtersBadgeText}>{activeFilters.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Location */}
      <Pressable style={styles.locationButton}>
        <Ionicons name="location" size={16} color={colors.primary} />
        <Text style={styles.locationText}>{location}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.gray500} />
      </Pressable>

      {/* Active Filters */}
      <ActiveFilterBar filters={activeFilters} />

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{restaurants.length} Results</Text>
      </View>

      {/* Results List */}
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => handleRestaurantPress(item)}
            onFavoriteToggle={() => handleFavoriteToggle(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.gray900,
    paddingVertical: 0,
  },
  filtersButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersButtonPressed: {
    opacity: 0.7,
  },
  filtersBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filtersBadgeText: {
    ...typography.caption2,
    color: colors.white,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  locationText: {
    ...typography.callout,
    color: colors.gray700,
  },
  resultsHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  resultsCount: {
    ...typography.headline,
    color: colors.gray900,
  },
  listContent: {
    paddingTop: spacing.sm,
  },
});
