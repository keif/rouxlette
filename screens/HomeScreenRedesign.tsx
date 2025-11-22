import React, { useState, useContext, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { RouletteWheel } from '../components/RouletteWheel';
import { ActiveFilterBar, ActiveFilter } from '../components/ActiveFilterBar';
import { colors, spacing, radius, typography } from '../theme';
import { RootContext } from '../context/RootContext';
import { setResults, setShowFilter, addSpinHistory, setSelectedBusiness, showBusinessModal, setFilters, setCategories } from '../context/reducer';
import useResults, { BusinessProps } from '../hooks/useResults';
import useLocation from '../hooks/useLocation';
import { useHistory } from '../hooks/useHistory';
import useCategories from '../hooks/useCategories';
import FiltersSheet from '../components/filter/FiltersSheet';
import { countActiveFilters } from '../utils/filterBusinesses';
import { RootTabScreenProps } from '../types';

export const HomeScreenRedesign: React.FC = () => {
  const { state, dispatch } = useContext(RootContext);
  const navigation = useNavigation<RootTabScreenProps<'Home'>['navigation']>();
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [selectedResult, setSelectedResult] = useState<BusinessProps | null>(null);
  const [resultsErrorMessage, searchResults, searchApi, searchApiWithResolver, resultsLoading] = useResults();
  const [, city, canonicalLocation, coords, , searchLocation, resolveSearchArea, isLocationLoading] = useLocation();
  const { addHistoryEntry } = useHistory();
  const { loadCategories } = useCategories();

  const isLoading = resultsLoading || isSearching;
  const hasResults = state.results && state.results.length > 0;
  const restaurantCount = state.results.length;
  const displayLocation = state.location || city || 'Current Location';
  const hasValidSearchQuery = searchQuery.trim().length >= 3; // Minimum 3 chars for food search
  const canSearch = hasValidSearchQuery && !isLoading && !isAutoSpinning;

  // Load categories on mount (static list)
  useEffect(() => {
    const categories = loadCategories();
    if (categories.length > 0) {
      dispatch(setCategories(categories));
    }
  }, []);

  // Build active filters array for display
  const activeFilters: ActiveFilter[] = [];

  // Price filters
  if (state.filters.priceLevels && state.filters.priceLevels.length > 0) {
    const priceLabel = '$'.repeat(Math.max(...state.filters.priceLevels));
    activeFilters.push({
      id: 'price',
      label: priceLabel,
      variant: 'included',
      onRemove: () => {
        dispatch(setFilters({ priceLevels: [] }));
      },
    });
  }

  // Open Now filter
  if (state.filters.openNow) {
    activeFilters.push({
      id: 'open-now',
      label: 'Open Now',
      variant: 'included',
      onRemove: () => {
        dispatch(setFilters({ openNow: false }));
      },
    });
  }

  // Category inclusions
  state.filters.categoryIds.forEach((categoryId, index) => {
    // Find category name from state.categories if available
    const category = state.categories.find(c => c.alias === categoryId);
    const label = category?.title || categoryId;
    activeFilters.push({
      id: `cat-${categoryId}`,
      label,
      variant: 'included',
      onRemove: () => {
        const newCategoryIds = state.filters.categoryIds.filter(id => id !== categoryId);
        dispatch(setFilters({ categoryIds: newCategoryIds }));
      },
    });
  });

  // Category exclusions
  state.filters.excludedCategoryIds.forEach((categoryId, index) => {
    const category = state.categories.find(c => c.alias === categoryId);
    const label = category?.title || categoryId;
    activeFilters.push({
      id: `exc-${categoryId}`,
      label: label,
      variant: 'excluded',
      onRemove: () => {
        const newExcludedIds = state.filters.excludedCategoryIds.filter(id => id !== categoryId);
        dispatch(setFilters({ excludedCategoryIds: newExcludedIds }));
      },
    });
  });

  const handleSpin = () => {
    // If no results yet but have valid query, trigger search first
    if (!hasResults && hasValidSearchQuery) {
      handleSearch();
      return;
    }

    if (!hasResults) {
      setErrorMessage('Please enter a search term first');
      return;
    }

    const randomIndex = Math.floor(Math.random() * state.results.length);
    const selectedRestaurant = state.results[randomIndex];

    addHistoryEntry({
      business: selectedRestaurant,
      source: 'spin',
      context: {
        searchTerm: searchQuery,
        locationText: displayLocation,
        coords: coords,
        filters: {
          openNow: state.filters.openNow,
          categories: state.filters.categoryIds,
          priceLevels: state.filters.priceLevels,
          radiusMeters: state.filters.radiusMeters,
          minRating: state.filters.minRating,
        },
      },
    });

    const spinEntry = {
      restaurant: selectedRestaurant,
      timestamp: Date.now(),
    };
    dispatch(addSpinHistory(spinEntry));
    dispatch(setSelectedBusiness(selectedRestaurant));
    dispatch(showBusinessModal());
  };

  const handleSearch = async () => {
    const term = searchQuery.trim();
    if (!term) return;

    setIsSearching(true);
    setErrorMessage('');
    try {
      let businesses: BusinessProps[] = [];
      const resolvedLocation = await resolveSearchArea(state.location || canonicalLocation);

      if (resolvedLocation) {
        businesses = await searchApiWithResolver(term, resolvedLocation);
      } else {
        businesses = await searchApi(term, state.location || 'Current Location', coords);
      }

      dispatch(setResults(businesses));

      // Pick random result after successful search
      if (businesses.length > 0) {
        const randomIndex = Math.floor(Math.random() * businesses.length);
        const selectedRestaurant = businesses[randomIndex];
        setSelectedResult(selectedRestaurant);
        // Start spinning NOW that we have a result
        setIsAutoSpinning(true);
      }
    } catch (error) {
      setErrorMessage('Failed to search restaurants. Please try again.');
      dispatch(setResults([]));
    } finally {
      setIsSearching(false);
    }
  };

  // Called when wheel finishes spinning animation
  const handleAutoSpinComplete = () => {
    setIsAutoSpinning(false);

    if (selectedResult) {
      addHistoryEntry({
        business: selectedResult,
        source: 'spin',
        context: {
          searchTerm: searchQuery,
          locationText: displayLocation,
          coords: coords,
          filters: {
            openNow: state.filters.openNow,
            categories: state.filters.categoryIds,
            priceLevels: state.filters.priceLevels,
            radiusMeters: state.filters.radiusMeters,
            minRating: state.filters.minRating,
          },
        },
      });

      const spinEntry = {
        restaurant: selectedResult,
        timestamp: Date.now(),
      };
      dispatch(addSpinHistory(spinEntry));
      dispatch(setSelectedBusiness(selectedResult));
      dispatch(showBusinessModal());

      // Clear selected result
      setSelectedResult(null);
    }
  };

  const handleFiltersPress = () => {
    dispatch(setShowFilter(true));
  };

  const handleViewAllResults = () => {
    // Navigate to Search tab
    navigation.navigate('Search');
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
            {countActiveFilters(state.filters) > 0 && (
              <View style={styles.filtersBadge}>
                <Text style={styles.filtersBadgeText}>
                  {countActiveFilters(state.filters)}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Roulette Wheel - Centered */}
        <View style={styles.wheelContainer}>
          <RouletteWheel
            onSpin={handleSpin}
            disabled={!isAutoSpinning && !canSearch && !hasResults}
            size={200}
            isAutoSpinning={isAutoSpinning}
            onAutoSpinComplete={handleAutoSpinComplete}
          />
          <Text style={styles.wheelHint}>
            {isLoading
              ? 'Searching...'
              : isAutoSpinning
              ? 'Spinning...'
              : hasResults
              ? 'Tap to spin again'
              : canSearch
              ? 'Tap to spin'
              : 'Enter search term'}
          </Text>
        </View>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <ActiveFilterBar filters={activeFilters} />
        )}

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
              onSubmitEditing={handleSearch}
              editable={!isLoading}
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
          <Text style={styles.locationText}>{displayLocation}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.gray500} />
        </Pressable>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Results Count */}
        {hasResults && (
          <View style={styles.resultsInfo}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.resultsText}>
              {restaurantCount} restaurant{restaurantCount !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (!canSearch && !hasResults) && styles.primaryButtonDisabled,
              (canSearch || hasResults) && !isLoading && !isAutoSpinning && styles.primaryButtonActive,
              pressed && (canSearch || hasResults) && !isLoading && !isAutoSpinning && styles.primaryButtonPressed,
            ]}
            disabled={!canSearch && !hasResults}
            onPress={handleSpin}
          >
            <Text
              style={[
                styles.primaryButtonText,
                (!canSearch && !hasResults) && styles.primaryButtonTextDisabled,
              ]}
            >
              {isLoading ? 'Searching...' : isAutoSpinning ? 'Spinning...' : hasResults ? 'Spin Again' : 'Spin for Me'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              !hasResults && styles.secondaryButtonDisabled,
              hasResults && !isLoading && !isAutoSpinning && styles.secondaryButtonActive,
              pressed && hasResults && !isLoading && !isAutoSpinning && styles.secondaryButtonPressed,
            ]}
            disabled={!hasResults}
            onPress={handleViewAllResults}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                !hasResults && styles.secondaryButtonTextDisabled,
                hasResults && !isLoading && !isAutoSpinning && styles.secondaryButtonTextActive,
              ]}
            >
              View All Results
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <FiltersSheet
        visible={state.showFilter}
        onClose={() => dispatch(setShowFilter(false))}
      />
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
  errorContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.error + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    ...typography.callout,
    color: colors.error,
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
    ...Platform.select({
      ios: {
        shadowOpacity: 0.05,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  primaryButtonActive: {
    backgroundColor: colors.success,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
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
  secondaryButtonDisabled: {
    borderColor: colors.gray300,
    backgroundColor: colors.gray100,
  },
  secondaryButtonActive: {
    borderColor: colors.success,
    backgroundColor: colors.white,
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    ...typography.headline,
    color: colors.primary,
  },
  secondaryButtonTextDisabled: {
    color: colors.gray500,
  },
  secondaryButtonTextActive: {
    color: colors.success,
  },
});
