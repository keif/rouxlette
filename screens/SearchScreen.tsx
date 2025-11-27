import React, {useContext, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View,} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {Restaurant, RestaurantCard} from '../components/RestaurantCard';
import {ActiveFilter, ActiveFilterBar} from '../components/ActiveFilterBar';
import {colors, radius, spacing, typography} from '../theme';
import {RootContext} from '../context/RootContext';
import {
    setCategories,
    setCoords,
    setFilters,
    setLocation,
    setResults,
    setSelectedBusiness,
    setShowFilter,
    showBusinessModal
} from '../context/reducer';
import useResults, {BusinessProps} from '../hooks/useResults';
import useLocation from '../hooks/useLocation';
import {useBlocked} from '../hooks/useBlocked';
import FiltersSheet from '../components/filter/FiltersSheet';
import {applyFilters, countActiveFilters} from '../utils/filterBusinesses';
import {RootTabScreenProps} from '../types';

// Convert BusinessProps to Restaurant interface for RestaurantCard
function businessToRestaurant(business: BusinessProps): Restaurant {
    return {
        id: business.id,
        name: business.name,
        imageUrl: business.image_url || 'https://via.placeholder.com/400x300.png?text=No+Image',
        rating: business.rating || 0,
        reviewCount: business.review_count || 0,
        price: business.price || '',
        distance: business.distance ? business.distance / 1609.34 : 0, // Convert meters to miles
        categories: business.categories?.map(c => c.title) || [],
        isFavorite: false, // We'll update this later with favorites logic
    };
}

export const SearchScreen: React.FC = () => {
    const {state, dispatch} = useContext(RootContext);
    const navigation = useNavigation<RootTabScreenProps<'Search'>['navigation']>();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isManualLocation, setIsManualLocation] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [locationInput, setLocationInput] = useState('');
    const [resultsErrorMessage, searchResults, searchApi, searchApiWithResolver, resultsLoading] = useResults();
    const [, city, canonicalLocation, coords, , searchLocation, resolveSearchArea, isLocationLoading, , stopLocationWatcher] = useLocation();
    const {blocked} = useBlocked();

    const isLoading = resultsLoading || isSearching;
    const displayLocation = state.location || city || 'Current Location';

    // Apply filters to state.results
    const filteredBusinesses = state.results.length > 0
        ? applyFilters(state.results, state.filters)
        : [];

    const restaurants = filteredBusinesses.map(businessToRestaurant);

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
                dispatch(setFilters({priceLevels: []}));
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
                dispatch(setFilters({openNow: false}));
            },
        });
    }

    // Category inclusions
    state.filters.categoryIds.forEach((categoryId) => {
        const category = state.categories.find(c => c.alias === categoryId);
        const label = category?.title || categoryId;
        activeFilters.push({
            id: `cat-${categoryId}`,
            label,
            variant: 'included',
            onRemove: () => {
                const newCategoryIds = state.filters.categoryIds.filter(id => id !== categoryId);
                dispatch(setFilters({categoryIds: newCategoryIds}));
            },
        });
    });

    // Category exclusions
    state.filters.excludedCategoryIds.forEach((categoryId) => {
        const category = state.categories.find(c => c.alias === categoryId);
        const label = category?.title || categoryId;
        activeFilters.push({
            id: `exc-${categoryId}`,
            label: label,
            variant: 'excluded',
            onRemove: () => {
                const newExcludedIds = state.filters.excludedCategoryIds.filter(id => id !== categoryId);
                dispatch(setFilters({excludedCategoryIds: newExcludedIds}));
            },
        });
    });

    // Update categories when results change
    useEffect(() => {
        if (state.results && state.results.length > 0) {
            const categories = state.results.reduce<any[]>((acc, curr) => {
                const currentCategories = curr.categories ?? [];
                acc.push(...currentCategories);
                return acc;
            }, []);

            // Filter to uniques
            const filteredCategories = categories.reduce<any[]>((acc, curr) => {
                if (!acc.find((item) => item.alias === curr.alias)) {
                    acc.push(curr);
                }
                return acc;
            }, []);

            dispatch(setCategories(filteredCategories));
        }
    }, [state.results]);

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

            // Filter out blocked restaurants
            const blockedIds = new Set(blocked.map(b => b.id));
            const filteredBusinesses = businesses.filter(b => !blockedIds.has(b.id));

            dispatch(setResults(filteredBusinesses));
        } catch (error) {
            setErrorMessage('Failed to search restaurants. Please try again.');
            dispatch(setResults([]));
        } finally {
            setIsSearching(false);
        }
    };

    const handleFiltersPress = () => {
        dispatch(setShowFilter(true));
    };

    const handleRestaurantPress = (restaurant: Restaurant) => {
        // Find the original business in state.results
        const business = filteredBusinesses.find(b => b.id === restaurant.id);
        if (business) {
            dispatch(setSelectedBusiness(business));
            dispatch(showBusinessModal());
        }
    };

    const handleFavoriteToggle = (restaurantId: string) => {
        // TODO: Implement favorites toggle with context
    };

    const handleUseCurrentLocation = async () => {
        setIsEditingLocation(false);
        setIsManualLocation(false);
        await searchLocation(''); // This will restart GPS watcher
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
            console.error('[SearchScreen] Error resolving location:', error);
            setErrorMessage(`Error finding "${trimmed}". Please try again.`);
            setTimeout(() => setErrorMessage(''), 5000);
        }
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
                        onSubmitEditing={handleSearch}
                        editable={!isLoading}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={20} color={colors.gray400}/>
                        </Pressable>
                    )}
                </View>

                {/* Filters Button */}
                <Pressable
                    onPress={handleFiltersPress}
                    style={({pressed}) => [
                        styles.filtersButton,
                        pressed && styles.filtersButtonPressed,
                    ]}
                >
                    <Ionicons name="options-outline" size={24} color={colors.primary}/>
                    {countActiveFilters(state.filters) > 0 && (
                        <View style={styles.filtersBadge}>
                            <Text style={styles.filtersBadgeText}>
                                {countActiveFilters(state.filters)}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Location */}
            {isEditingLocation ? (
                <View style={styles.locationEditContainer}>
                    <View style={styles.locationInputWrapper}>
                        <Ionicons name="location" size={16} color={colors.primary}/>
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
                            <Pressable onPress={() => setLocationInput('')} hitSlop={8}>
                                <Ionicons name="close-circle" size={20} color={colors.gray400}/>
                            </Pressable>
                        )}
                    </View>
                    <Pressable
                        onPress={handleUseCurrentLocation}
                        style={({pressed}) => [
                            styles.gpsButton,
                            pressed && styles.gpsButtonPressed,
                        ]}
                    >
                        <Ionicons name="navigate" size={16} color={colors.primary}/>
                        <Text style={styles.gpsButtonText}>Use GPS</Text>
                    </Pressable>
                </View>
            ) : (
                <Pressable style={styles.locationButton} onPress={handleLocationPress}>
                    <Ionicons name="location" size={16} color={colors.primary}/>
                    <Text style={styles.locationText}>{displayLocation}</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.gray500}/>
                </Pressable>
            )}

            {/* Active Filters */}
            {activeFilters.length > 0 && (
                <ActiveFilterBar filters={activeFilters}/>
            )}

            {/* Loading State */}
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary}/>
                    <Text style={styles.loadingText}>Searching...</Text>
                </View>
            )}

            {/* Error Message */}
            {errorMessage && !isLoading && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            )}

            {/* Results */}
            {!isLoading && restaurants.length > 0 && (
                <>
                    {/* Results Count */}
                    <View style={styles.resultsHeader}>
                        <Text style={styles.resultsCount}>
                            {restaurants.length} Result{restaurants.length !== 1 ? 's' : ''}
                        </Text>
                    </View>

                    {/* Results List */}
                    <FlatList
                        data={restaurants}
                        keyExtractor={(item) => item.id}
                        renderItem={({item}) => (
                            <RestaurantCard
                                restaurant={item}
                                onPress={() => handleRestaurantPress(item)}
                                onFavoriteToggle={() => handleFavoriteToggle(item.id)}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                </>
            )}

            {/* Empty State */}
            {!isLoading && restaurants.length === 0 && state.results.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={64} color={colors.gray400}/>
                    <Text style={styles.emptyTitle}>Search for restaurants</Text>
                    <Text style={styles.emptySubtitle}>
                        Enter a search term above to find restaurants
                    </Text>
                </View>
            )}

            {/* No Results After Filtering */}
            {!isLoading && restaurants.length === 0 && state.results.length > 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="options-outline" size={64} color={colors.gray400}/>
                    <Text style={styles.emptyTitle}>No matches found</Text>
                    <Text style={styles.emptySubtitle}>
                        Try adjusting your filters to see more results
                    </Text>
                </View>
            )}

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
                shadowOffset: {width: 0, height: 1},
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
    locationEditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
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
        gap: spacing.xs,
    },
    locationText: {
        ...typography.callout,
        color: colors.gray700,
    },
    locationInput: {
        flex: 1,
        ...typography.callout,
        color: colors.gray900,
        paddingVertical: 0,
        marginLeft: spacing.xs,
    },
    gpsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.white,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.primary,
        gap: spacing.xs,
        flexShrink: 0,
    },
    gpsButtonPressed: {
        opacity: 0.7,
    },
    gpsButtonText: {
        ...typography.callout,
        color: colors.primary,
        fontWeight: '600',
        flexShrink: 0,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['2xl'],
    },
    loadingText: {
        ...typography.callout,
        color: colors.gray600,
        marginTop: spacing.md,
    },
    errorContainer: {
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
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
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing['2xl'],
    },
    emptyTitle: {
        ...typography.title3,
        color: colors.gray900,
        marginTop: spacing.lg,
        textAlign: 'center',
    },
    emptySubtitle: {
        ...typography.callout,
        color: colors.gray600,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
});
