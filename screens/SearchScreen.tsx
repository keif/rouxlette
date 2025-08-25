import React, { useContext, useEffect, useRef, useState } from "react";
import { CategoryProps, INIT_RESULTS, PRICE_OPTIONS, ResultsProps } from "../hooks/useResults";
import { Animated, LayoutAnimation, Platform, StyleSheet, UIManager, Pressable, Text } from "react-native";
import { View } from "../components/Themed";
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import Config from "../Config";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SearchScreen = () => {
	const { dispatch, state } = useContext(RootContext);
	const [term, setTerm] = useState<string>(``);
	const [filterTerm, setFilterTerm] = useState<string>(``);
	const [searchResults, setSearchResults] = useState<ResultsProps>(INIT_RESULTS);
	const [filterResults, setFilterResults] = useState<ResultsProps>(INIT_RESULTS);
	const [toggleStyle, setToggleStyle] = useState(true);
	const [hasFocus, setFocus] = useState(false);
	const [errorMessage, setErrorMessage] = useState(``);
	const [showFiltersSheet, setShowFiltersSheet] = useState(false);
	const borderRadius = useRef(new Animated.Value(0)).current;

	// Initialize filter persistence
	useFiltersPersistence();

	useEffect(() => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		const hasSearchResults = searchResults && searchResults.businesses.length > 0;
		if (hasFocus || hasSearchResults) {
			Animated.timing(borderRadius, {
				duration: 500,
				toValue: 20,
				// toValue: hasFocus ? 20 : 0,
				useNativeDriver: true,
			}).start();

			setToggleStyle(false);
			// generate list of category objects
			const categories: CategoryProps[] = searchResults.businesses.reduce<CategoryProps[]>((acc, curr) => {
				acc.push(...curr.categories);
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

	useEffect(() => {
		if (hasFocus || hasSearchResults) {
			setToggleStyle(false);
		}
	}, [hasFocus]);

	// Apply new client-side filters
	useEffect(() => {
		if (searchResults.businesses.length > 0) {
			// Apply the new filters to search results
			const filteredBusinesses = applyFilters(searchResults.businesses, state.filters);
			const finalResults = { id: searchResults.id, businesses: filteredBusinesses };
			setFilterResults(finalResults);
		} else {
			setFilterResults(searchResults);
		}
	}, [searchResults, state.filters]);

	const hasSearchResults = searchResults && searchResults.businesses.length;
	return (
		<SafeAreaProvider>
			<View style={[styles.container, toggleStyle ? styles.containerRow : styles.containerColumn]}>
				<View style={styles.controller}>
					<Animated.View
						style={[styles.animatedContainer, { borderRadius }]}
					>
						<View style={styles.searchHeader}>
							<View style={styles.searchInputContainer}>
								<SearchInput
									onFocus={() => setFocus(true)}
									placeholder={`What are you craving?`}
									setErrorMessage={setErrorMessage}
									setResults={setSearchResults}
									setTerm={setTerm}
									term={term}
								/>
							</View>
							{(hasFocus || hasSearchResults) && (
								<Pressable
									style={({ pressed }) => [
										styles.filtersButton,
										{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 }
									]}
									onPress={() => setShowFiltersSheet(true)}
									android_ripple={{ color: 'lightgrey', radius: 20, borderless: true }}
								>
									<Icon name="tune" size={24} color={AppStyles.color.roulette.gold} />
									{countActiveFilters(state.filters) > 0 && (
										<View style={styles.filtersBadge}>
											<Text style={styles.filtersBadgeText}>
												{countActiveFilters(state.filters)}
											</Text>
										</View>
									)}
								</Pressable>
							)}
						</View>
						{
							hasFocus || hasSearchResults ? (
								<LocationInput
									onFocus={() => setFocus(true)}
									setErrorMessage={setErrorMessage}
								/>
							) : null
						}
					</Animated.View>
					{errorMessage !== `` ?
						<View>
							<ErrorMessageView text={errorMessage} />
						</View>
						: null}
					{
						hasSearchResults ? (
							<View>
								<FilteredOutput term={term} filterTerm={filterTerm} searchResults={searchResults}
												filteredResults={filterResults} />
							</View>
						) : null
					}
				</View>
				<StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />

				<FiltersSheet
					visible={showFiltersSheet}
					onClose={() => setShowFiltersSheet(false)}
				/>
			</View>
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
	containerColumn: {
		flexDirection: `column`,
	},
	containerRow: {
		flexDirection: `row`,
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
		shadowColor: AppStyles.input.shadow,
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
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
