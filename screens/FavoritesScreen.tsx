import React, { useContext } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from '../components/Themed';
import RestaurantCard from '../components/search/RestaurantCard';
import AppStyles from '../AppStyles';
import { RootContext } from '../context/RootContext';

const FavoritesScreen: React.FC = () => {
  const { state } = useContext(RootContext);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>❤️ Favorites</Text>
          <Text style={styles.subtitle}>
            Your saved restaurants
          </Text>
        </View>

        {state.favorites.length > 0 ? (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {state.favorites.map((restaurant, index) => (
              <View key={restaurant.id} style={styles.cardContainer}>
                <RestaurantCard business={restaurant} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💔</Text>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>
              Search for restaurants and tap the heart icon to save your favorites!
            </Text>
          </View>
        )}

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
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greylight,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  cardContainer: {
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greylight,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default FavoritesScreen;