import React, { useContext, useEffect, useState } from "react";
import { CategoryProps, INIT_RESULTS, PRICE_OPTIONS, ResultsProps } from "../hooks/useResults";
import { LayoutAnimation, Platform, StyleSheet, UIManager } from "react-native";
import { View } from "../components/Themed";
import SearchInput from "../components/search/SearchInput";
import LocationInput from "../components/search/LocationInput";
import FilteredOutput from "../components/search/FilteredOutput";
import { RootContext } from "../context/RootContext";
import AppStyles from "../AppStyles";
import { StatusBar } from "expo-status-bar";
import { setCategories } from "../context/reducer";
import { SafeAreaProvider } from "react-native-safe-area-context";

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

	useEffect(() => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		if (searchResults && searchResults.businesses.length > 0) {
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

	return (
		<SafeAreaProvider>
			<View style={[styles.container, toggleStyle ? styles.containerRow : styles.containerColumn]}>
				<View style={styles.controller}>
					<SearchInput
						placeholder={`What are you craving?`}
						setResults={setSearchResults}
						setTerm={setTerm}
						term={term}
					/>
					{
						searchResults && searchResults.businesses.length ? (
							<View>
								<LocationInput />
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
});

export default SearchScreen;
