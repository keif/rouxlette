import React, {useContext, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View,} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import {Restaurant} from '../components/RestaurantCardSimple';
import {RestaurantTopPick} from '../components/RestaurantTopPick';
import {RestaurantRow} from '../components/RestaurantRow';
import {ActiveFilter, ActiveFilterBar} from '../components/ActiveFilterBar';
import {radius, spacing, typography} from '../theme';
import {supperClub} from '../theme/supperClub';
import {RootContext} from '../context/RootContext';
import {
    setCategories,
    setCoords,
    setFilters,
    setLocation,
    setResults,
    setLastSearch,
    setSelectedBusiness,
    setShowFilter,
    showBusinessModal
} from '../context/reducer';
import useResults, {BusinessProps} from '../hooks/useResults';
import {useRadiusReconcile} from '../hooks/useRadiusReconcile';
import useLocation from '../hooks/useLocation';
import {useBlocked} from '../hooks/useBlocked';
import {useBlockFavorite} from '../hooks/useBlockFavorite';
import FiltersSheet from '../components/filter/FiltersSheet';
import {applyFilters, countActiveFilters} from '../utils/filterBusinesses';
import {RootTabScreenProps} from '../types';

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
    const {isFavorite, isBlocked, handleFavorite, handleBlock} = useBlockFavorite();

    const isLoading = resultsLoading || isSearching;
    const displayLocation = state.location || city || 'Current Location';

    // Apply filters to state.results
    const filteredBusinesses = state.results.length > 0
        ? applyFilters(state.results, state.filters)
        : [];

    // Convert BusinessProps to Restaurant interface for RestaurantCard
    const businessToRestaurant = (business: BusinessProps): Restaurant => ({
        id: business.id,
        name: business.name,
        imageUrl: business.image_url || 'https://via.placeholder.com/400x300.png?text=No+Image',
        rating: business.rating || 0,
        reviewCount: business.review_count || 0,
        price: business.price || '',
        distance: business.distance ? business.distance / 1609.34 : 0,
        categories: business.categories?.map(c => c.title) || [],
        isFavorite: isFavorite(business.id),
        isBlocked: isBlocked(business.id),
    });

    const restaurants = filteredBusinesses.map(businessToRestaurant);

    // The results hero is the wheel's ACTUAL pick (most recent spin), not just
    // the first result — otherwise the "The wheel picked" badge lands on the
    // wrong restaurant (#48). Gate it on the pick being present in the CURRENT
    // filtered results: this keeps the hero's actions resolvable (it's a real
    // item from `restaurants`) and avoids a STALE badge after a fresh search,
    // since spinHistory persists across sessions. Otherwise: neutral top result.
    const lastSpinWinner = state.spinHistory?.[0]?.restaurant;
    const winnerInResults = lastSpinWinner
        ? restaurants.find(r => r.id === lastSpinWinner.id)
        : undefined;
    const heroRestaurant = winnerInResults ?? restaurants[0];
    const heroIsWheelPick = !!winnerInResults;
    const rowRestaurants = restaurants.filter(r => r.id !== heroRestaurant?.id);

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

            // Filter out blocked restaurants
            const blockedIds = new Set(blocked.map(b => b.id));
            const filteredBusinesses = businesses.filter(b => !blockedIds.has(b.id));

            dispatch(setResults(filteredBusinesses));
            // Record the committed search identity so radius reconciliation has a
            // shared source of truth across screens (#58).
            dispatch(setLastSearch({
                term,
                coords: coords ? { latitude: coords.latitude, longitude: coords.longitude } : null,
                radiusMeters,
            }));
        } catch (error) {
            setErrorMessage('Failed to search restaurants. Please try again.');
            dispatch(setResults([]));
        } finally {
            setIsSearching(false);
        }
    };

    // Browse screen: refetch as soon as the applied radius diverges from the
    // displayed results' radius. The committed term/radius live in shared state,
    // so this reconciles even when results arrived from another screen (#55/#58).
    //
    // Gated on focus: a tab navigator keeps this screen mounted after blur, so
    // without the gate a distance change made on Home would trigger a background
    // refetch here and silently replace Home's results. Regaining focus flips
    // autoWhenIdle back on and reconciles any radius changed while away.
    const isSearchFocused = useIsFocused();
    useRadiusReconcile({
        isSearching,
        autoWhenIdle: isSearchFocused,
        runSearch: (term) => handleSearch(term),
    });

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
        const business = filteredBusinesses.find(b => b.id === restaurantId);
        if (business) {
            handleFavorite(business);
        }
    };

    const handleBlockToggle = (restaurantId: string) => {
        const business = filteredBusinesses.find(b => b.id === restaurantId);
        if (business) {
            handleBlock(business);
        }
    };

    const handleDirections = (restaurant: Restaurant) => {
        const business = filteredBusinesses.find(b => b.id === restaurant.id);
        const lat = business?.coordinates?.latitude;
        const lng = business?.coordinates?.longitude;
        const query = encodeURIComponent(restaurant.name);
        const url = lat != null && lng != null
            ? Platform.select({
                ios: `maps://?q=${query}&ll=${lat},${lng}`,
                default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
            })
            : `https://www.google.com/maps/search/?api=1&query=${query}`;
        if (url) {
            Linking.openURL(url).catch(() => {});
        }
    };

    // "Spin again" re-rolls a random pick from the current results and opens it
    // in the same detail modal the wheel uses.
    const handleSpinAgain = () => {
        if (filteredBusinesses.length === 0) return;
        const pick = filteredBusinesses[Math.floor(Math.random() * filteredBusinesses.length)];
        dispatch(setSelectedBusiness(pick));
        dispatch(showBusinessModal());
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
                        <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={20} color={supperClub.textMuted}/>
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
                    <Ionicons name="options-outline" size={24} color={supperClub.gold}/>
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
                        <Ionicons name="location" size={16} color={supperClub.gold}/>
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
                                <Ionicons name="close-circle" size={20} color={supperClub.textMuted}/>
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
                        <Ionicons name="navigate" size={16} color={supperClub.gold}/>
                        <Text style={styles.gpsButtonText}>Use GPS</Text>
                    </Pressable>
                </View>
            ) : (
                <Pressable style={styles.locationButton} onPress={handleLocationPress}>
                    <Ionicons name="location" size={16} color={supperClub.gold}/>
                    <Text style={styles.locationText}>{displayLocation}</Text>
                    <Ionicons name="chevron-down" size={16} color={supperClub.textMuted}/>
                </Pressable>
            )}

            {/* Active Filters */}
            {activeFilters.length > 0 && (
                <ActiveFilterBar filters={activeFilters}/>
            )}

            {/* Loading State */}
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={supperClub.gold}/>
                    <Text style={styles.loadingText}>Searching...</Text>
                </View>
            )}

            {/* Error Message */}
            {errorMessage && !isLoading && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            )}

            {/* Results — hero top pick + compact rows (Supper Club) */}
            {!isLoading && restaurants.length > 0 && (
                <FlatList
                    data={rowRestaurants}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={
                        <>
                            <View style={styles.resultsHeader}>
                                <Text style={styles.resultsCount}>
                                    {restaurants.length} Result{restaurants.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                            <RestaurantTopPick
                                restaurant={heroRestaurant}
                                badgeLabel={heroIsWheelPick ? undefined : 'Top result'}
                                onPress={() => handleRestaurantPress(heroRestaurant)}
                                onFavoriteToggle={() => handleFavoriteToggle(heroRestaurant.id)}
                                onDirections={() => handleDirections(heroRestaurant)}
                                onSpinAgain={handleSpinAgain}
                            />
                            {rowRestaurants.length > 0 && (
                                <Text style={styles.subhead}>More nearby</Text>
                            )}
                        </>
                    }
                    renderItem={({item}) => (
                        <RestaurantRow
                            restaurant={item}
                            onPress={() => handleRestaurantPress(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Empty State */}
            {!isLoading && restaurants.length === 0 && state.results.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={64} color={supperClub.textMuted}/>
                    <Text style={styles.emptyTitle}>Search for restaurants</Text>
                    <Text style={styles.emptySubtitle}>
                        Enter a search term above to find restaurants
                    </Text>
                </View>
            )}

            {/* No Results After Filtering */}
            {!isLoading && restaurants.length === 0 && state.results.length > 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="options-outline" size={64} color={supperClub.textMuted}/>
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
        backgroundColor: supperClub.background,
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
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: supperClub.border,
        paddingHorizontal: spacing.md,
        height: 44,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.6)',
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
        color: supperClub.textPrimary,
        paddingVertical: 0,
    },
    filtersButton: {
        width: 44,
        height: 44,
        borderRadius: radius.full,
        backgroundColor: 'rgba(255,255,255,0.05)',
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['2xl'],
    },
    loadingText: {
        ...typography.callout,
        color: supperClub.textMuted,
        marginTop: spacing.md,
    },
    errorContainer: {
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
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
    resultsHeader: {
        paddingVertical: spacing.md,
    },
    resultsCount: {
        ...typography.headline,
        color: supperClub.textPrimary,
    },
    subhead: {
        fontSize: 11,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: supperClub.textMuted,
        marginTop: spacing.xs,
        marginBottom: spacing.sm,
    },
    listContent: {
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.md,
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
        color: supperClub.textPrimary,
        marginTop: spacing.lg,
        textAlign: 'center',
    },
    emptySubtitle: {
        ...typography.callout,
        color: supperClub.textMuted,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
});
