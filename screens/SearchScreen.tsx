import React, { useContext, useEffect, useState } from "react";
import { Category, Result } from "../hooks/useResults";
import { LayoutAnimation, Platform, StyleSheet, UIManager } from "react-native";
import { View } from "../components/Themed";
import SearchInput from "../components/search/SearchInput";
import LocationInput from "../components/search/LocationInput";
import FilteredOutput from "../components/search/FilteredOutput";
import { RootContext } from "../context/RootContext";
import useLocation from "../hooks/useLocation";
import AppStyles from "../AppStyles";
import { StatusBar } from "expo-status-bar";
import { setCategories } from "../context/reducer";
import { SearchBar } from "@rneui/base";
import { SafeAreaProvider } from "react-native-safe-area-context";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SearchScreen = () => {
	const { dispatch, state } = useContext(RootContext);
	const [term, setTerm] = useState<string>(``);
	const [filterTerm, setFilterTerm] = useState<string>(``);
	const [searchResults, setSearchResults] = useState<Array<Result>>([]);
	const [filterResults, setFilterResults] = useState<Array<Result>>([]);
	const [toggleStyle, setToggleStyle] = useState(`row`);
	const [locationErrorMessage, city, locationResults, searchLocation] = useLocation();

	useEffect(() => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		if (searchResults.length > 0) {
			setToggleStyle(`column`);
			// generate list of category objects
			const categories: Category[] = searchResults.reduce<Category[]>((acc, curr) => {
				acc.push(...curr.categories);
				return acc;
			}, []);
			// filter to uniques
			const filteredCategories: Category[] = categories.reduce<Category[]>((acc, curr) => {
				if (!acc.find((item) => item.alias === curr.alias)) {
					acc.push(curr);
				}
				return acc;
			}, []);

			dispatch(setCategories(filteredCategories));
		}
	}, [searchResults]);

	return (
		// @ts-ignore
		<SafeAreaProvider>
			<View style={[styles.container, { flexDirection: toggleStyle }]}>
				<View style={styles.controller}>
					<SearchInput
						icon={`search`}
						city={city}
						location={city}
						onTermChange={setTerm}
						placeholder={`What are you craving?`}
						setResults={setSearchResults}
						term={term}
					/>
					{
						searchResults.length ? (
							<View>
								{/*<SearchInput*/}
								{/*	icon={`filter`}*/}
								{/*	city={city}*/}
								{/*	location={city}*/}
								{/*	onTermChange={setFilterTerm}*/}
								{/*	placeholder={`…but you don't want?`}*/}
								{/*	setResults={setFilterResults}*/}
								{/*	term={filterTerm}*/}
								{/*/>*/}
								<LocationInput />
								<FilteredOutput term={term} filterTerm={filterTerm} searchResults={searchResults}
												filteredResults={filterResults} />
							</View>
						) : null
					}
				</View>
				<StatusBar style={Platform.OS === "ios" ? "light" : "auto"} style={{ height: 80 }} />
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
	controller: {
		flex: 1,
		width: `100%`,
	},
});

export default SearchScreen;
