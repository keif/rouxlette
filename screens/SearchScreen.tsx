import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { CategoryProps, INIT_RESULTS, PRICE_OPTIONS, ResultsProps } from "../hooks/useResults";
import { RootTabScreenProps } from "../types";
import { Animated, LayoutAnimation, Platform, StyleSheet, UIManager, Pressable, ActivityIndicator, KeyboardAvoidingView } from "react-native";
import { View, Text } from "../components/Themed";
import SearchInput from "../components/search/SearchInput";
import LocationInput from "../components/search/LocationInput";
import FilteredOutput from "../components/search/FilteredOutput";
import { RootContext } from "../context/RootContext";
import AppStyles from "../AppStyles";
import { StatusBar } from "expo-status-bar";
import { setCategories } from "../context/reducer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorMessageView from "../components/shared/ErrorMessageView";
import FiltersSheet from "../components/filter/FiltersSheet";
import useFiltersPersistence from "../hooks/useFiltersPersistence";
import { applyFilters, countActiveFilters } from "../utils/filterBusinesses";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Config from "../Config";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SearchScreen = () => {
	const { dispatch, state } = useContext(RootContext);
	const navigation = useNavigation<RootTabScreenProps<'Search'>['navigation']>();
	const route = useRoute<RootTabScreenProps<'Search'>['route']>();
	const [term, setTerm] = useState<string>(``);
	const [filterTerm, setFilterTerm] = useState<string>(``);
	const [searchResults, setSearchResults] = useState<ResultsProps>(INIT_RESULTS);
	const [filterResults, setFilterResults] = useState<ResultsProps>(INIT_RESULTS);
	const [toggleStyle, setToggleStyle] = useState(true);
	const [hasFocus, setFocus] = useState(false);
	const [errorMessage, setErrorMessage] = useState(``);
	const [showFiltersSheet, setShowFiltersSheet] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const borderRadius = useRef(new Animated.Value(0)).current;

	// Initialize filter persistence (now with hardened AsyncStorage handling)
	const { isHydrated } = useFiltersPersistence();

	// Handle param-based opening and cleanup
	useFocusEffect(
		useCallback(() => {
			// Safe route params access with defaults
			const routeParams = route?.params ?? {};
			const openOnMount = routeParams.openFilters === true;
			
			if (openOnMount) {
				setShowFiltersSheet(true);
				// Clear param so it only happens once
				navigation.setParams({ openFilters: undefined });
			}

			// Cleanup: reset modal state on blur to prevent sticky behavior
			return () => {
				setShowFiltersSheet(false);
			};
		}, [route?.params?.openFilters, navigation])
	);

	useEffect(() => {
		const hasSearchResults = searchResults && (searchResults.businesses ?? []).length > 0;
		if (hasSearchResults) {
			// generate list of category objects - safe iteration
			const businesses = searchResults.businesses ?? [];
			const categories: CategoryProps[] = businesses.reduce<CategoryProps[]>((acc, curr) => {
				const currentCategories = curr.categories ?? [];
				acc.push(...currentCategories);
				return acc;
			}, []);
			// filter to uniques
			const filteredCategories: CategoryProps[] = categories.reduce<CategoryProps[]>((acc, curr) => {
				if (!acc.find((item) => item.alias === curr.alias)) {
					acc.push(curr);
				}
				return acc;
			}, []);

			dispatch(setCategories(filteredCategories));
		}
	}, [searchResults]);

	// Apply new client-side filters
	useEffect(() => {
		const businesses = searchResults.businesses ?? [];
		if (businesses.length > 0) {
			// Apply the new filters to search results
			const filteredBusinesses = applyFilters(businesses, state.filters);
			const finalResults: ResultsProps = { id: searchResults.id, businesses: filteredBusinesses };
			setFilterResults(finalResults);
		} else {
			setFilterResults(searchResults);
		}
	}, [searchResults, state.filters]);

	const hasSearchResults = searchResults && (searchResults.businesses ?? []).length > 0;
	return (
		<SafeAreaProvider>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<View style={[styles.container, styles.containerColumn]}>
					<View style={styles.controller}>
					<View style={styles.animatedContainer}>
						<View style={styles.searchHeader}>
							<View style={styles.searchInputContainer}>
								<SearchInput
									onFocus={() => setFocus(true)}
									placeholder={`What are you craving?`}
									setErrorMessage={setErrorMessage}
									setResults={setSearchResults}
									setTerm={setTerm}
									term={term}
									isLoading={isSearching}
									setIsLoading={setIsSearching}
								/>
							</View>
							<Pressable
								testID="filters-open-button-search"
								style={({ pressed }) => [
									styles.filtersButton,
									{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 }
								]}
								onPress={() => setShowFiltersSheet(true)}
								android_ripple={{ color: 'lightgrey', radius: 20, borderless: true }}
							>
								<Icon name="tune" size={24} color={AppStyles.color.roulette.accent} />
								{countActiveFilters(state.filters) > 0 && (
									<View style={styles.filtersBadge}>
										<Text style={styles.filtersBadgeText}>
											{countActiveFilters(state.filters).toString()}
										</Text>
									</View>
								)}
							</Pressable>
						</View>
						<LocationInput
							onFocus={() => setFocus(true)}
							setErrorMessage={setErrorMessage}
						/>
					</View>
					{isSearching && (
						<View style={{ paddingVertical: 24, alignItems: 'center' }}>
							<ActivityIndicator size="large" />
							<Text style={{ marginTop: 10 }}>Searching…</Text>
						</View>
					)}
					{errorMessage !== `` ? (
						<View>
							<ErrorMessageView text={errorMessage} />
						</View>
					) : null}
					{hasSearchResults ? (
						<View style={{ flex: 1 }}>
							<FilteredOutput
								term={term}
								filterTerm={filterTerm}
								searchResults={searchResults}
								filteredResults={filterResults}
								isLoading={isSearching}
							/>
						</View>
					) : null}
				</View>
				<StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />

				<FiltersSheet
					testID="filters-sheet"
					visible={showFiltersSheet}
					onClose={() => setShowFiltersSheet(false)}
				/>
			</View>
		</KeyboardAvoidingView>
		</SafeAreaProvider>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		backgroundColor: AppStyles.color.background,
		flex: 1,
		justifyContent: "center",
		overflow: "hidden",
	},
	containerWithResults: {
		justifyContent: "flex-start",
		overflow: "visible",
	},
	containerColumn: {
		flexDirection: `column`,
		justifyContent: "flex-start",
	},
	controller: {
		flex: 1,
		width: `100%`,
	},
	animatedContainer: {
		backgroundColor: AppStyles.color.background,
		marginHorizontal: 8,
		marginTop: 8,
		marginBottom: 20,
		borderRadius: 20,
		shadowColor: AppStyles.input.shadow,
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
		flexShrink: 0,
	},
	searchHeader: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	searchInputContainer: {
		flex: 1,
	},
	filtersButton: {
		padding: 8,
		marginRight: 8,
		position: 'relative',
	},
	filtersBadge: {
		position: 'absolute',
		top: 2,
		right: 2,
		backgroundColor: AppStyles.color.roulette.red,
		borderRadius: 10,
		minWidth: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	filtersBadgeText: {
		color: AppStyles.color.white,
		fontSize: 12,
		fontFamily: AppStyles.fonts.bold,
	},
});

export default SearchScreen;
