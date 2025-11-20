import React, { useContext, useState } from 'react';
import { StyleSheet, ScrollView, Text, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from '../components/Themed';
import RouletteButton from '../components/shared/RouletteButton';
import QuickActionsPanel from '../components/search/QuickActionsPanel';
import PopularCategories from '../components/search/PopularCategories';
import ErrorMessageView from '../components/shared/ErrorMessageView';
import FiltersSheet from '../components/filter/FiltersSheet';
import FilterChip from '../components/shared/FilterChip';
import { countActiveFilters } from '../utils/filterBusinesses';
import AppStyles from '../AppStyles';
import Config from '../Config';
import { RootContext } from '../context/RootContext';
import { addSpinHistory, setSelectedBusiness, showBusinessModal, setShowFilter } from '../context/reducer';
import { BusinessProps } from '../hooks/useResults';
import useResults from '../hooks/useResults';
import useLocation from '../hooks/useLocation';
import { setResults } from '../context/reducer';
import { useHistory } from '../hooks/useHistory';

const FEATURED_CATEGORIES = [
  { title: 'Pizza', emoji: '', term: 'pizza' },
  { title: 'Sushi', emoji: '', term: 'sushi' },
  { title: 'Coffee', emoji: '', term: 'coffee' },
  { title: 'Burgers', emoji: '', term: 'burgers' },
  { title: 'Mexican', emoji: '', term: 'mexican' },
  { title: 'Thai', emoji: '', term: 'thai' },
];

const HomeScreen: React.FC = () => {
  const { state, dispatch } = useContext(RootContext);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [resultsErrorMessage, searchResults, searchApi, searchApiWithResolver, resultsLoading] = useResults();
  const [, city, canonicalLocation, coords, , searchLocation, resolveSearchArea, isLocationLoading] = useLocation();
  const { addHistoryEntry } = useHistory();

  const isLoading = resultsLoading || isSearching;
  const hasResults = state.results && state.results.length > 0;

  const handleRouletteSpIn = () => {
    if (!hasResults) {
      setErrorMessage('Please search for restaurants first');
      return;
    }

    if (__DEV__) {
      console.log('[[spin] context]', {
        searchTerm: searchTerm,
        currentLocation: state.location || city,
        coords: coords ? `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}` : 'none',
        resultCount: state.results.length,
      });
    }

    const randomIndex = Math.floor(Math.random() * state.results.length);
    const selectedRestaurant = state.results[randomIndex];

    addHistoryEntry({
      business: selectedRestaurant,
      source: 'spin',
      context: {
        searchTerm: searchTerm,
        locationText: state.location || city,
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

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      setIsSearching(true);
      try {
        let businesses: BusinessProps[] = [];
        const resolvedLocation = await resolveSearchArea(state.location || canonicalLocation);

        if (resolvedLocation) {
          businesses = await searchApiWithResolver(term, resolvedLocation);
        } else {
          businesses = await searchApi(term, state.location || 'Current Location', coords);
        }

        dispatch(setResults(businesses));
      } catch (error) {
        setErrorMessage('Failed to search restaurants. Please try again.');
        dispatch(setResults([]));
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleCategoryPress = async (categoryTerm: string) => {
    setSearchTerm(categoryTerm);
    setIsSearching(true);

    try {
      let businesses: BusinessProps[] = [];
      const resolvedLocation = await resolveSearchArea(state.location || canonicalLocation);

      if (resolvedLocation) {
        businesses = await searchApiWithResolver(categoryTerm, resolvedLocation);
      } else {
        businesses = await searchApi(categoryTerm, state.location || 'Current Location', coords);
      }

      dispatch(setResults(businesses));
    } catch (error) {
      setErrorMessage('Failed to search restaurants. Please try again.');
      dispatch(setResults([]));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header with filter button */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.appTitle}>Rouxlette</Text>
            <Text style={styles.subtitle}>Find your next meal</Text>
          </View>
          <TouchableOpacity
            testID="filters-open-button-home"
            onPress={() => dispatch(setShowFilter(true))}
            style={styles.filterButton}
          >
            <Ionicons name="options" size={24} color={AppStyles.color.primary} />
            {countActiveFilters(state.filters) > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {countActiveFilters(state.filters)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Roulette Wheel */}
          <View style={styles.wheelSection}>
            <RouletteButton
              onSpin={handleRouletteSpIn}
              disabled={!hasResults || isLoading}
            />
          </View>

          {/* Active Filters */}
          {hasResults && countActiveFilters(state.filters) > 0 && (
            <View style={styles.filtersSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersScroll}
              >
                {state.filters.openNow && (
                  <FilterChip
                    label="Open Now"
                    variant="active"
                    icon="time"
                    style={styles.filterChip}
                  />
                )}
                {state.filters.priceLevels && state.filters.priceLevels.length > 0 && (
                  <FilterChip
                    label={'$'.repeat(Math.max(...state.filters.priceLevels))}
                    variant="active"
                    style={styles.filterChip}
                  />
                )}
              </ScrollView>
            </View>
          )}

          {/* Search Trigger */}
          <Pressable
            style={({ pressed }) => [
              styles.searchTrigger,
              pressed && !Config.isAndroid && styles.searchTriggerPressed,
            ]}
            onPress={() => {/* Navigate to search tab */}}
            android_ripple={{ color: AppStyles.color.gray100 }}
          >
            <Ionicons name="search" size={20} color={AppStyles.color.gray500} />
            <Text style={styles.searchTriggerText}>Search restaurants</Text>
          </Pressable>

          {/* Location Display */}
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color={AppStyles.color.primary} />
            <Text style={styles.locationText}>
              {state.location || city || 'Current Location'}
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <QuickActionsPanel
              onSearch={handleSearch}
              setErrorMessage={setErrorMessage}
              externalQuery={searchTerm}
              isLoading={isLoading}
            />
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <ErrorMessageView text={errorMessage} />
            </View>
          ) : null}

          {/* Results Summary */}
          {hasResults && (
            <View style={styles.resultsInfo}>
              <Ionicons name="checkmark-circle" size={20} color={AppStyles.color.success} />
              <Text style={styles.resultsText}>
                {state.results.length} restaurants ready
              </Text>
            </View>
          )}

          {/* Featured Categories */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Quick Search</Text>
            <PopularCategories
              categories={FEATURED_CATEGORIES}
              onSelect={handleCategoryPress}
              disabled={isLoading}
            />
          </View>

          {/* Recent Spins */}
          {state.spinHistory.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={20} color={AppStyles.color.gray700} />
                <Text style={styles.sectionTitle}>Recent Spins</Text>
              </View>
              {state.spinHistory.slice(0, 3).map((spin) => (
                <Pressable
                  key={spin.timestamp}
                  style={({ pressed }) => [
                    styles.historyItem,
                    pressed && !Config.isAndroid && styles.historyItemPressed,
                  ]}
                  android_ripple={{ color: AppStyles.color.gray100 }}
                >
                  <View style={styles.historyContent}>
                    <Text style={styles.historyName} numberOfLines={1}>
                      {spin.restaurant.name}
                    </Text>
                    <Text style={styles.historyTime}>
                      {new Date(spin.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={AppStyles.color.gray300} />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        <StatusBar style="auto" />

        {/* Filters Sheet */}
        <FiltersSheet
          testID="filters-sheet"
          visible={state.showFilter}
          onClose={() => dispatch(setShowFilter(false))}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppStyles.color.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppStyles.spacing.m,
    paddingTop: AppStyles.spacing.m,
    paddingBottom: AppStyles.spacing.s,
    backgroundColor: AppStyles.color.white,
    borderBottomWidth: 1,
    borderBottomColor: AppStyles.color.border,
  },
  headerContent: {
    flex: 1,
  },
  appTitle: {
    ...AppStyles.typography.largeTitle,
    color: AppStyles.color.gray900,
  },
  subtitle: {
    ...AppStyles.typography.callout,
    color: AppStyles.color.gray500,
    marginTop: 2,
  },
  filterButton: {
    ...AppStyles.button.icon,
    backgroundColor: AppStyles.color.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: AppStyles.color.accentRed,
    borderRadius: AppStyles.radius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    ...AppStyles.typography.caption2,
    color: AppStyles.color.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: AppStyles.spacing.xl,
  },
  wheelSection: {
    alignItems: 'center',
    paddingVertical: AppStyles.spacing.l,
  },
  filtersSection: {
    marginBottom: AppStyles.spacing.m,
  },
  filtersScroll: {
    paddingHorizontal: AppStyles.spacing.m,
    gap: AppStyles.spacing.s,
  },
  filterChip: {
    marginRight: AppStyles.spacing.s,
  },
  searchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: AppStyles.spacing.m,
    marginBottom: AppStyles.spacing.s,
    paddingHorizontal: AppStyles.spacing.m,
    paddingVertical: 12,
    backgroundColor: AppStyles.color.white,
    borderRadius: AppStyles.radius.m,
    borderWidth: 1,
    borderColor: AppStyles.color.gray300,
    ...AppStyles.shadow.level1,
  },
  searchTriggerPressed: {
    opacity: 0.7,
  },
  searchTriggerText: {
    ...AppStyles.typography.body,
    color: AppStyles.color.gray500,
    marginLeft: AppStyles.spacing.s,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: AppStyles.spacing.m,
    marginBottom: AppStyles.spacing.m,
    paddingHorizontal: AppStyles.spacing.m,
    paddingVertical: AppStyles.spacing.s,
  },
  locationText: {
    ...AppStyles.typography.callout,
    color: AppStyles.color.gray700,
    marginLeft: AppStyles.spacing.xs,
  },
  actionsSection: {
    paddingHorizontal: AppStyles.spacing.m,
    marginBottom: AppStyles.spacing.m,
  },
  errorContainer: {
    marginHorizontal: AppStyles.spacing.m,
    marginBottom: AppStyles.spacing.m,
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: AppStyles.spacing.m,
    marginBottom: AppStyles.spacing.m,
    paddingHorizontal: AppStyles.spacing.m,
    paddingVertical: AppStyles.spacing.m,
    backgroundColor: AppStyles.color.success + '15',
    borderRadius: AppStyles.radius.m,
    borderLeftWidth: 3,
    borderLeftColor: AppStyles.color.success,
  },
  resultsText: {
    ...AppStyles.typography.callout,
    fontWeight: '600',
    color: AppStyles.color.success,
    marginLeft: AppStyles.spacing.s,
  },
  categoriesSection: {
    marginTop: AppStyles.spacing.s,
  },
  sectionTitle: {
    ...AppStyles.typography.title3,
    color: AppStyles.color.gray900,
    marginHorizontal: AppStyles.spacing.m,
    marginBottom: AppStyles.spacing.m,
  },
  historySection: {
    marginTop: AppStyles.spacing.xl,
    paddingHorizontal: AppStyles.spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppStyles.spacing.m,
    gap: AppStyles.spacing.s,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: AppStyles.spacing.m,
    paddingHorizontal: AppStyles.spacing.m,
    backgroundColor: AppStyles.color.white,
    borderRadius: AppStyles.radius.m,
    marginBottom: AppStyles.spacing.s,
    ...AppStyles.shadow.level1,
  },
  historyItemPressed: {
    opacity: 0.7,
  },
  historyContent: {
    flex: 1,
    marginRight: AppStyles.spacing.m,
  },
  historyName: {
    ...AppStyles.typography.headline,
    color: AppStyles.color.gray900,
    marginBottom: 2,
  },
  historyTime: {
    ...AppStyles.typography.footnote,
    color: AppStyles.color.gray500,
  },
});

export default HomeScreen;
