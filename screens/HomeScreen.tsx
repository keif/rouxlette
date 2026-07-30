import React, { useState, useContext, useEffect, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, radius, typography } from '../theme';
import { supperClub, supperClubPalette, supperClubGlow } from '../theme/supperClub';
import { RootContext } from '../context/RootContext';
import { setResults, setLastSearch, setShowFilter, addSpinHistory, setSelectedBusiness, showBusinessModal, setFilters, setCategories, setLocation, setCoords, computeVisibleResults } from '../context/reducer';
import useResults, { BusinessProps } from '../hooks/useResults';
import { useRadiusReconcile } from '../hooks/useRadiusReconcile';
import useLocation from '../hooks/useLocation';
import { useHistory } from '../hooks/useHistory';
import { useBlocked } from '../hooks/useBlocked';
import { useDealbreakers } from '../hooks/useDealbreakers';
import useCategories from '../hooks/useCategories';
import { AvoidingBar } from '../components/AvoidingBar';
import FiltersSheet from '../components/filter/FiltersSheet';
import { countActiveFilters } from '../utils/filterBusinesses';
import { RootTabScreenProps } from '../types';

export const HomeScreen: React.FC = () => {
  const { state, dispatch } = useContext(RootContext);
  const navigation = useNavigation<RootTabScreenProps<'Home'>['navigation']>();
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [selectedResult, setSelectedResult] = useState<BusinessProps | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [resultsErrorMessage, searchResults, searchApi, searchApiWithResolver, resultsLoading] = useResults();
  const [, city, canonicalLocation, coords, , searchLocation, resolveSearchArea, isLocationLoading, , stopLocationWatcher] = useLocation();
  const { addHistoryEntry } = useHistory();
  const { blocked } = useBlocked();
  // Hydrate/persist dealbreakers regardless of entry route (mirrors useBlocked).
  useDealbreakers();
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

    // Radius changed since the current results were fetched (e.g. the user
    // widened Distance in the filter sheet). Yelp returns a different set for a
    // new radius, so re-search the committed term before spinning instead of
    // spinning the stale, narrower result set (#55/#58). The refetch auto-spins
    // on completion.
    if (reconcile()) {
      return;
    }

    // Pick random result and trigger spin animation
    const randomIndex = Math.floor(Math.random() * state.results.length);
    const selectedRestaurant = state.results[randomIndex];
    setSelectedResult(selectedRestaurant);
    setIsAutoSpinning(true);
  };

  const handleSearch = async (termOverride?: string) => {
    const term = (termOverride ?? searchQuery).trim();
    if (!term) return;

    const radiusMeters = state.filters.radiusMeters;
    setIsSearching(true);
    setErrorMessage('');
    try {
      let businesses: BusinessProps[] = [];
      const resolvedLocation = await resolveSearchArea(state.location || canonicalLocation);

      if (resolvedLocation) {
        businesses = await searchApiWithResolver(term, resolvedLocation, radiusMeters);
      } else {
        businesses = await searchApi(term, state.location || 'Current Location', coords, radiusMeters);
      }

      // Dispatch the RAW set; the reducer filters it for the visible results.
      // The local spin pool must use the SAME filtering authority as the visible
      // results (dealbreakers + per-search excludes/price/rating + blocked) so
      // the wheel's first spin after a search can never land on an excluded
      // restaurant (e.g. a "Never show me" cuisine).
      const spinnable = computeVisibleResults(
        businesses,
        state.filters,
        blocked,
        state.dealbreakerCategoryIds,
      );

      dispatch(setResults(businesses));
      // Record the committed search identity for cross-screen radius
      // reconciliation (#58).
      dispatch(setLastSearch({
        term,
        coords: coords ? { latitude: coords.latitude, longitude: coords.longitude } : null,
        radiusMeters,
      }));

      // Pick random result after successful search
      if (spinnable.length > 0) {
        const randomIndex = Math.floor(Math.random() * spinnable.length);
        const selectedRestaurant = spinnable[randomIndex];
        setSelectedResult(selectedRestaurant);
        // Start spinning NOW that we have a result
        setIsAutoSpinning(true);
      }
    } catch (error) {
      setErrorMessage('Failed to search restaurants. Please try again.');
      dispatch(setResults([]));
      // Results were cleared — drop the committed identity so a later radius
      // change doesn't replay this (failed) query over empty state (#58).
      dispatch(setLastSearch(null));
    } finally {
      setIsSearching(false);
    }
  };

  // Spin screen: don't auto-refetch on an idle radius change (that would spin
  // the wheel unprompted). `reconcile()` is invoked explicitly from handleSpin,
  // and the hook still refetches if the radius changed mid-search (#55/#58).
  const { reconcile } = useRadiusReconcile({
    isSearching,
    autoWhenIdle: false,
    runSearch: (term) => handleSearch(term),
  });

  // The winner modal's "Spin Again" bumps spinRequestId; re-run the spin so the
  // wheel animates (visible behind the translucent modal) and the modal reveals
  // the new winner when it settles.
  const prevSpinRequestId = useRef(state.spinRequestId);
  useEffect(() => {
    if (state.spinRequestId === prevSpinRequestId.current) return;
    prevSpinRequestId.current = state.spinRequestId;
    handleSpin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.spinRequestId]);

  // Called when wheel finishes spinning animation
  const handleAutoSpinComplete = () => {
    setIsAutoSpinning(false);

    if (selectedResult) {
      addHistoryEntry({
        business: selectedResult,
        source: 'spin',
        context: {
          // The committed term the displayed results were fetched with — correct
          // even when the spin replayed a committed search (from another screen)
          // while Home's input box was blank or holding an unsubmitted draft (#58).
          searchTerm: state.lastSearch?.term ?? searchQuery,
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
      dispatch(showBusinessModal('spin'));

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

  const handleLocationPress = () => {
    setLocationInput(displayLocation);
    setIsEditingLocation(true);
  };

  const handleLocationSubmit = async () => {
    const trimmed = locationInput.trim();
    setIsEditingLocation(false);

    if (!trimmed || trimmed === displayLocation) {
      // No change
      return;
    }

    if (trimmed === '') {
      // Empty = revert to GPS
      setIsManualLocation(false);
      await searchLocation('');
      return;
    }

    // Stop GPS and geocode the city
    setIsManualLocation(true);
    stopLocationWatcher();

    try {
      const resolved = await resolveSearchArea(trimmed);

      if (resolved?.coords) {
        dispatch(setLocation(resolved.label));
        dispatch(setCoords(resolved.coords as any));
      } else if (resolved?.source === 'fallback') {
        // Geocoding failed, but we can still use text search
        dispatch(setLocation(trimmed));
        dispatch(setCoords(null));
        setErrorMessage(`Using text search for "${trimmed}" (coordinates unavailable)`);
        setTimeout(() => setErrorMessage(''), 3000);
      } else {
        setErrorMessage(`Could not find "${trimmed}". Please try another city.`);
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      console.error('[HomeScreen] Error resolving location:', error);
      setErrorMessage(`Error finding "${trimmed}". Please try again.`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsEditingLocation(false);
    setIsManualLocation(false);
    await searchLocation(''); // This will restart GPS watcher
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[supperClubPalette.aubergine, supperClubPalette.espresso]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
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
            <Ionicons name="options-outline" size={24} color={supperClub.gold} />
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

        {/* Avoiding bar — summarizes dealbreakers + per-search excludes and opens
            the Filters sheet. Home has no blocked-hidden count of its own. */}
        <View style={styles.avoidingBarWrap}>
          <AvoidingBar
            dealbreakers={state.dealbreakerCategoryIds}
            perSearchExcludes={state.filters.excludedCategoryIds}
            includes={state.filters.categoryIds}
            blockedCount={0}
            onPress={handleFiltersPress}
          />
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
              color={supperClub.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="What are you craving?"
              placeholderTextColor={supperClub.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
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
                  color={supperClub.textMuted}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Location */}
        {isEditingLocation ? (
          <View style={styles.locationEditContainer}>
            <View style={styles.locationInputWrapper}>
              <Ionicons name="location" size={16} color={supperClub.gold} />
              <TextInput
                style={styles.locationInput}
                value={locationInput}
                onChangeText={setLocationInput}
                onSubmitEditing={handleLocationSubmit}
                onBlur={handleLocationSubmit}
                autoFocus
                placeholder="Enter city name"
                returnKeyType="done"
              />
              {locationInput.length > 0 && (
                <Pressable onPress={() => setLocationInput('')}>
                  <Ionicons name="close-circle" size={20} color={supperClub.textMuted} />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={handleUseCurrentLocation}
              style={({ pressed }) => [
                styles.gpsButton,
                pressed && styles.gpsButtonPressed,
              ]}
            >
              <Ionicons name="navigate" size={16} color={supperClub.gold} />
              <Text style={styles.gpsButtonText}>Use GPS</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.locationButton} onPress={handleLocationPress}>
            <Ionicons name="location" size={16} color={supperClub.gold} />
            <Text style={styles.locationText}>{displayLocation}</Text>
            <Ionicons name="chevron-down" size={16} color={supperClub.textMuted} />
          </Pressable>
        )}

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Results Count */}
        {hasResults && (
          <View style={styles.resultsInfo}>
            <Ionicons name="checkmark-circle" size={20} color={supperClub.success} />
            <Text style={styles.resultsText}>
              {restaurantCount} restaurant{restaurantCount !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Fixed Bottom CTA Buttons */}
      <SafeAreaView edges={['bottom']} style={styles.bottomButtonContainer}>
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
              View All
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

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
    backgroundColor: supperClub.background,
  },
  scrollContent: {
    paddingBottom: 100, // Space for fixed bottom buttons
  },
  bottomButtonContainer: {
    backgroundColor: supperClub.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: spacing.sm,
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
    fontFamily: 'Georgia',
    color: '#FFFFFF',
    ...supperClubGlow.wordmarkText,
  },
  subtitle: {
    ...typography.callout,
    color: supperClub.textMuted,
    marginTop: 2,
  },
  filtersButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.6)',
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
    backgroundColor: supperClub.error,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filtersBadgeText: {
    ...typography.caption2,
    color: supperClub.textPrimary,
  },
  wheelContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  wheelHint: {
    ...typography.callout,
    color: supperClub.textMuted,
    marginTop: spacing.md,
  },
  avoidingBarWrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: supperClub.border,
    paddingHorizontal: spacing.md,
    height: 50,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.6)',
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
    color: supperClub.textPrimary,
    paddingVertical: 0,
  },
  locationEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
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
    color: supperClub.text,
  },
  locationInput: {
    flex: 1,
    ...typography.callout,
    color: supperClub.textPrimary,
    paddingVertical: 0,
    marginLeft: spacing.xs,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: supperClub.gold,
    gap: spacing.xs,
    flexShrink: 0,
  },
  gpsButtonPressed: {
    opacity: 0.7,
  },
  gpsButtonText: {
    ...typography.callout,
    color: supperClub.gold,
    fontWeight: '600',
    flexShrink: 0,
  },
  errorContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: supperClub.error + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: supperClub.error,
  },
  errorText: {
    ...typography.callout,
    color: supperClub.error,
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: supperClub.success + '15',
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
    color: supperClub.success,
  },
  ctaContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: supperClub.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.6)',
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
    backgroundColor: 'rgba(255,255,255,0.12)',
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
    backgroundColor: supperClub.success,
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
    color: supperClub.textPrimary,
  },
  primaryButtonTextDisabled: {
    color: supperClub.textMuted,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: supperClub.gold,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryButtonActive: {
    borderColor: supperClub.success,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    ...typography.headline,
    color: supperClub.gold,
  },
  secondaryButtonTextDisabled: {
    color: supperClub.textMuted,
  },
  secondaryButtonTextActive: {
    color: supperClub.success,
  },
});
