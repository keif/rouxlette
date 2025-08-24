import React, { useContext, useState } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from '../components/Themed';
import RouletteButton from '../components/shared/RouletteButton';
import QuickActionsPanel from '../components/search/QuickActionsPanel';
import CategoryCard from '../components/shared/CategoryCard';
import ErrorMessageView from '../components/shared/ErrorMessageView';
import DevLocationDebug from '../components/shared/DevLocationDebug';
import AppStyles from '../AppStyles';
import { RootContext } from '../context/RootContext';
import { addSpinHistory, setSelectedBusiness, showBusinessModal } from '../context/reducer';
import { BusinessProps } from '../hooks/useResults';
import useResults, { INIT_RESULTS } from '../hooks/useResults';
import useLocation from '../hooks/useLocation';
import { setResults } from '../context/reducer';

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
  const [, searchResults, searchYelp] = useResults();
  const [, city, coords, , , isLocationLoading] = useLocation();

  const hasResults = state.results && state.results.length > 0;

  const handleRouletteSpIn = () => {
    if (!hasResults) {
      setErrorMessage('Please search for restaurants first!');
      return;
    }

    // Pick random restaurant from results
    const randomIndex = Math.floor(Math.random() * state.results.length);
    const selectedRestaurant = state.results[randomIndex];

    // Add to spin history
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
      try {
        await searchYelp(term, state.location || 'Current Location', coords);
        if (searchResults.businesses.length > 0) {
          dispatch(setResults(searchResults.businesses));
        }
      } catch (error) {
        setErrorMessage('Failed to search restaurants. Please try again.');
      }
    }
  };

  const handleCategoryPress = async (categoryTerm: string) => {
    setSearchTerm(categoryTerm);
    try {
      await searchYelp(categoryTerm, state.location || 'Current Location', coords);
      if (searchResults.businesses.length > 0) {
        dispatch(setResults(searchResults.businesses));
      }
    } catch (error) {
      setErrorMessage('Failed to search restaurants. Please try again.');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>🎲 Rouxlette</Text>
            <Text style={styles.subtitle}>
              Your personal restaurant roulette
            </Text>
          </View>

          {/* Main Roulette Section */}
          <View style={styles.heroSection}>
            <RouletteButton
              onSpin={handleRouletteSpIn}
              disabled={!hasResults}
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <QuickActionsPanel
              onSearch={handleSearch}
              setErrorMessage={setErrorMessage}
            />
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <ErrorMessageView text={errorMessage} />
            </View>
          ) : null}

          {/* Dev Location Debug */}
          <DevLocationDebug 
            coords={coords}
            city={city}
            isLoading={isLocationLoading}
          />

          {/* Results Summary */}
          {hasResults ? (
            <View style={styles.resultsInfo}>
              <Text style={styles.resultsText}>
                🎯 Found {state.results.length} restaurants ready for roulette!
              </Text>
            </View>
          ) : null}

          {/* Featured Categories */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Popular Categories</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {FEATURED_CATEGORIES.map((category, index) => (
                <CategoryCard
                  key={index}
                  title={category.title}
                  emoji={category.emoji}
                  onPress={() => handleCategoryPress(category.term)}
                />
              ))}
            </ScrollView>
          </View>

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
  categoriesSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 8,
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