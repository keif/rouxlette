import React, { useContext, useEffect, useState } from "react";
import { CategoryProps, BusinessProps } from "../hooks/useResults";
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
import { SafeAreaProvider } from "react-native-safe-area-context";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SearchScreen = () => {
	const { dispatch, state } = useContext(RootContext);
	const [term, setTerm] = useState<string>(``);
	const [filterTerm, setFilterTerm] = useState<string>(``);
	const [searchResults, setSearchResults] = useState<Array<BusinessProps>>([]);
	const [filterResults, setFilterResults] = useState<Array<BusinessProps>>([]);
	const [toggleStyle, setToggleStyle] = useState(true);
	const [locationErrorMessage, city, locationResults, searchLocation] = useLocation();

	useEffect(() => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		if (searchResults.length > 0) {
			setToggleStyle(false);
			// generate list of category objects
			const categories: CategoryProps[] = searchResults.reduce<CategoryProps[]>((acc, curr) => {
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

	return (
		<SafeAreaProvider>
			<View style={[styles.container, toggleStyle ? styles.containerRow : styles.containerColumn]}>
				<View style={styles.controller}>
					<SearchInput
						city={city}
						onTermChange={setTerm}
						placeholder={`What are you craving?`}
						setResults={setSearchResults}
						term={term}
					/>
					{
						searchResults.length ? (
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
