import React, { useContext, useEffect, useRef, useState } from "react";
import { CategoryProps, INIT_RESULTS, PRICE_OPTIONS, ResultsProps } from "../hooks/useResults";
import { Animated, LayoutAnimation, Platform, StyleSheet, UIManager } from "react-native";
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
	const borderRadius = useRef(new Animated.Value(0)).current;

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

	useEffect(() => {
		if (state.filter?.price?.length) {
			console.log(`filter by price`);
			const filterPriceOpts = state.filter.price?.map(price => PRICE_OPTIONS[price]);
			const filterByPriceResults = searchResults.businesses.filter((result) => filterPriceOpts.indexOf(result.price) > -1);
			const finalResults = { id: searchResults.id, businesses: filterByPriceResults };
			setFilterResults(finalResults);
		} else {
			setFilterResults(searchResults);
		}
	}, [state.filter]);

	const hasSearchResults = searchResults && searchResults.businesses.length;
	return (
		<SafeAreaProvider>
			<View style={[styles.container, toggleStyle ? styles.containerRow : styles.containerColumn]}>
				<View style={styles.controller}>
					<Animated.View
						style={[styles.animatedContainer, { borderRadius }]}
					>
						<SearchInput
							onFocus={() => setFocus(true)}
							placeholder={`What are you craving?`}
							setErrorMessage={setErrorMessage}
							setResults={setSearchResults}
							setTerm={setTerm}
							term={term}
						/>
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
});

export default SearchScreen;
