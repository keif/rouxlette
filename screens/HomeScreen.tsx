import React, { useContext, useState } from 'react';
import { StyleSheet, ScrollView, Text, Pressable, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from '../components/Themed';
import RouletteButton from '../components/shared/RouletteButton';
import QuickActionsPanel from '../components/search/QuickActionsPanel';
import PopularCategories from '../components/search/PopularCategories';
import ErrorMessageView from '../components/shared/ErrorMessageView';
import DevLocationDebug from '../components/shared/DevLocationDebug';
import FiltersSheet from '../components/filter/FiltersSheet';
import { countActiveFilters } from '../utils/filterBusinesses';
import AppStyles from '../AppStyles';
import Config from '../Config';
import { RootContext } from '../context/RootContext';
import { addSpinHistory, setSelectedBusiness, showBusinessModal, setShowFilter } from '../context/reducer';
import { BusinessProps } from '../hooks/useResults';
import useResults, { INIT_RESULTS } from '../hooks/useResults';
import useLocation from '../hooks/useLocation';
import { setResults } from '../context/reducer';
import { useHistory } from '../hooks/useHistory';

const FEATURED_CATEGORIES = [
  { title: 'Pizza', emoji: '🍕', term: 'pizza' },
  { title: 'Sushi', emoji: '🍣', term: 'sushi' },
  { title: 'Coffee', emoji: '☕', term: 'coffee' },
  { title: 'Burgers', emoji: '🍔', term: 'burgers' },
  { title: 'Mexican', emoji: '🌮', term: 'mexican' },
  { title: 'Thai', emoji: '🍜', term: 'thai' },
];

const HomeScreen: React.FC = () => {
  const { state, dispatch } = useContext(RootContext);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [, searchResults, searchApi, searchApiWithResolver, resultsLoading] = useResults();
  const [, city, canonicalLocation, coords, , searchLocation, resolveSearchArea, isLocationLoading] = useLocation();
  const { addHistoryEntry } = useHistory();

  // Use results hook loading state for UI
  const isLoading = resultsLoading || isSearching;

  // Filter persistence is handled by SearchScreen

  const hasResults = state.results && state.results.length > 0;

  const handleRouletteSpIn = () => {
    if (!hasResults) {
      setErrorMessage('Please search for restaurants first!');
      return;
    }

    // Debug logging to identify wrong city issues
    if (__DEV__) {
      console.log('[[spin] context]', {
        searchTerm: searchTerm,
        currentLocation: state.location || city,
        coords: coords ? `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}` : 'none',
        resultCount: state.results.length,
        sampleBusinessLocations: state.results.slice(0, 3).map(r => `${r.name} in ${r.location?.display_address?.[1] || 'unknown'}`),
      });
    }

    // Pick random restaurant from results
    const randomIndex = Math.floor(Math.random() * state.results.length);
    const selectedRestaurant = state.results[randomIndex];

    // Add to new history tracking system
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

    // Also keep the old spin history for backward compatibility (for now)
    const spinEntry = {
      restaurant: selectedRestaurant,
      timestamp: Date.now(),
    };
    dispatch(addSpinHistory(spinEntry));

    // Show the selected restaurant in modal
    dispatch(setSelectedBusiness(selectedRestaurant));
    dispatch(showBusinessModal());
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      setIsSearching(true);
      try {
        let businesses: BusinessProps[] = [];
        
        // Use enhanced resolver for better location accuracy
        const resolvedLocation = await resolveSearchArea(state.location || canonicalLocation);
        if (resolvedLocation) {
          businesses = await searchApiWithResolver(term, resolvedLocation);
        } else {
          // Fallback to legacy search
          businesses = await searchApi(term, state.location || 'Current Location', coords);
        }
        
        // Always dispatch results, even if empty
        dispatch(setResults(businesses));
      } catch (error) {
        setErrorMessage('Failed to search restaurants. Please try again.');
        dispatch(setResults([])); // Clear results on error
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleCategoryPress = async (categoryTerm: string) => {
    // Immediately update search term for UI
    setSearchTerm(categoryTerm);
    setIsSearching(true);
    
    try {
      let businesses: BusinessProps[] = [];
      
      // Use enhanced resolver for better location accuracy
      const resolvedLocation = await resolveSearchArea(state.location || canonicalLocation);
      if (resolvedLocation) {
        businesses = await searchApiWithResolver(categoryTerm, resolvedLocation);
      } else {
        // Fallback to legacy search
        businesses = await searchApi(categoryTerm, state.location || 'Current Location', coords);
      }
      
      // Always dispatch results, even if empty
      dispatch(setResults(businesses));
    } catch (error) {
      setErrorMessage('Failed to search restaurants. Please try again.');
      dispatch(setResults([])); // Clear results on error
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Filter Button */}
        <TouchableOpacity
          testID="filters-open-button-home"
          onPress={() => dispatch(setShowFilter(true))}
          style={styles.headerFiltersButton}
        >
          <Icon name="tune" size={22} color={AppStyles.color.roulette.gold} />
          {countActiveFilters(state.filters) > 0 && (
            <View style={styles.headerFiltersBadge}>
              <Text style={styles.headerFiltersBadgeText}>
                {countActiveFilters(state.filters).toString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.appTitle}>🎲 Rouxlette</Text>
            </View>
            <Text style={styles.subtitle}>
              Your personal restaurant roulette
            </Text>
          </View>

          {/* Main Roulette Section */}
          <View style={styles.heroSection}>
            <RouletteButton
              onSpin={handleRouletteSpIn}
              disabled={!hasResults || isLoading}
            />
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

          {/* Dev Location Debug */}
          {/* <DevLocationDebug 
            coords={coords}
            city={city}
            isLoading={isLocationLoading}
          /> */}

          {/* Results Summary */}
          {hasResults ? (
            <View style={styles.resultsInfo}>
              <Text style={styles.resultsText}>
                🎯 Found {state.results.length.toString()} restaurants ready for roulette!
              </Text>
            </View>
          ) : null}

          {/* Featured Categories */}
          <PopularCategories
            categories={FEATURED_CATEGORIES}
            onSelect={handleCategoryPress}
            disabled={isLoading}
          />

          {/* Recent Spins */}
          {state.spinHistory.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Recent Spins</Text>
              {state.spinHistory.slice(0, 3).map((spin, index) => (
                <View key={spin.timestamp} style={styles.historyItem}>
                  <Text style={styles.historyText}>
                    🎲 {spin.restaurant.name}
                  </Text>
                  <Text style={styles.historyTime}>
                    {new Date(spin.timestamp).toLocaleDateString()}
                  </Text>
                </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    position: 'relative',
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  headerFiltersButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    zIndex: 9999,
    backgroundColor: 'transparent',
  },
  headerFiltersBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: AppStyles.color.roulette.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerFiltersBadgeText: {
    color: AppStyles.color.white,
    fontSize: 11,
    fontFamily: AppStyles.fonts.bold,
  },
  appTitle: {
    fontSize: 32,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.roulette.gold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
    textAlign: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionsSection: {
    paddingHorizontal: 16,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  resultsInfo: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    backgroundColor: AppStyles.color.roulette.green + '20',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: AppStyles.color.roulette.green,
  },
  resultsText: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.roulette.green,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  historySection: {
    marginTop: 32,
    marginHorizontal: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppStyles.color.white,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: AppStyles.color.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyText: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
    flex: 1,
  },
  historyTime: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greylight,
  },
});

export default HomeScreen;