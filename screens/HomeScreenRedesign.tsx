import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouletteWheel } from '../components/RouletteWheel';
import { ActiveFilterBar, ActiveFilter } from '../components/ActiveFilterBar';
import { colors, spacing, radius, typography } from '../theme';

export const HomeScreenRedesign: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Columbus, OH');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([
    { id: '1', label: 'Pizza', variant: 'included', onRemove: () => {} },
    { id: '2', label: '$$', variant: 'included', onRemove: () => {} },
    { id: '3', label: 'Bars', variant: 'excluded', onRemove: () => {} },
  ]);
  const [restaurantCount, setRestaurantCount] = useState(42);

  const hasResults = restaurantCount > 0;

  const handleSpin = () => {
    console.log('Spinning!');
    // Navigate to result or show modal
  };

  const handleFiltersPress = () => {
    console.log('Open filters modal');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rouxlette</Text>
            <Text style={styles.subtitle}>Find your next meal</Text>
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

        {/* Roulette Wheel - Centered */}
        <View style={styles.wheelContainer}>
          <RouletteWheel
            onSpin={handleSpin}
            disabled={!hasResults}
            size={200}
          />
          <Text style={styles.wheelHint}>
            {hasResults
              ? "Tap to spin"
              : "Search to get started"}
          </Text>
        </View>

        {/* Active Filters */}
        <ActiveFilterBar filters={activeFilters} />

        {/* Search Input */}
        <View style={styles.searchContainer}>
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
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={8}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.gray400}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Location */}
        <Pressable style={styles.locationButton}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.locationText}>{location}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.gray500} />
        </Pressable>

        {/* Results Count */}
        {hasResults && (
          <View style={styles.resultsInfo}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.resultsText}>
              {restaurantCount} restaurants found
            </Text>
          </View>
        )}

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              !hasResults && styles.primaryButtonDisabled,
              pressed && hasResults && styles.primaryButtonPressed,
            ]}
            disabled={!hasResults}
            onPress={handleSpin}
          >
            <Text
              style={[
                styles.primaryButtonText,
                !hasResults && styles.primaryButtonTextDisabled,
              ]}
            >
              Spin for Me
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>View All Results</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.title1,
    color: colors.gray900,
  },
  subtitle: {
    ...typography.callout,
    color: colors.gray600,
    marginTop: 2,
  },
  filtersButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
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
  wheelContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  wheelHint: {
    ...typography.callout,
    color: colors.gray600,
    marginTop: spacing.md,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 50,
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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  locationText: {
    ...typography.callout,
    color: colors.gray700,
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  resultsText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.success,
  },
  ctaContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    ...typography.headline,
    color: colors.white,
  },
  primaryButtonTextDisabled: {
    color: colors.gray500,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    ...typography.headline,
    color: colors.primary,
  },
});
