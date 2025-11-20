import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, Text, FlatList, TextInput, Pressable } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from '../components/Themed';
import FavoriteCard from '../components/shared/FavoriteCard';
import AppStyles from '../AppStyles';
import { useFavorites } from '../hooks/useFavorites';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { FavoriteItem } from '../types/favorites';
import Config from '../Config';

const FavoritesScreen: React.FC = () => {
  const { favorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Filter favorites based on search query
  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) {
      return favorites;
    }

    const query = searchQuery.toLowerCase().trim();
    return favorites.filter(favorite => 
      favorite.name.toLowerCase().includes(query) ||
      favorite.categories.some(cat => cat.toLowerCase().includes(query)) ||
      favorite.location?.city?.toLowerCase().includes(query)
    );
  }, [favorites, searchQuery]);

  const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => (
    <FavoriteCard favorite={item} />
  );

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Favorites</Text>
              {favorites.length > 0 && (
                <Text style={styles.subtitle}>
                  {favorites.length} saved restaurant{favorites.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
            
            {favorites.length > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.searchButton,
                  { opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
                ]}
                onPress={toggleSearch}
                android_ripple={{
                  color: AppStyles.color.background,
                  radius: 20,
                  borderless: true,
                }}
              >
                <MaterialIcons 
                  name={showSearch ? "close" : "search"} 
                  size={24} 
                  color={AppStyles.color.primary} 
                />
              </Pressable>
            )}
          </View>

          {showSearch && (
            <View style={styles.searchContainer}>
              <MaterialIcons 
                name="search" 
                size={20} 
                color={AppStyles.color.greylight} 
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search favorites by name, category, or city..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
                placeholderTextColor={AppStyles.color.greylight}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <MaterialIcons 
                    name="clear" 
                    size={20} 
                    color={AppStyles.color.greylight} 
                  />
                </Pressable>
              )}
            </View>
          )}
        </View>

        {filteredFavorites.length > 0 ? (
          <FlatList
            data={filteredFavorites}
            renderItem={renderFavoriteItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={AppStyles.color.gray300} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>
              Search for restaurants and tap the heart icon to save your favorites!
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color={AppStyles.color.gray300} />
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or browse all {favorites.length} favorites.
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
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: AppStyles.color.white,
    borderBottomWidth: 1,
    borderBottomColor: AppStyles.color.background,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greylight,
  },
  searchButton: {
    backgroundColor: AppStyles.color.background,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppStyles.color.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppStyles.color.background,
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.black,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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