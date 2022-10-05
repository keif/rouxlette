import React, { useContext, useEffect, useState } from "react";
import { Result } from "../hooks/useResults";
import { StyleSheet } from "react-native";
import { View } from "../components/Themed";
import SearchInput from "../components/SearchInput";
import LocationInput from "../components/LocationInput";
import FilteredOutput from "../components/FilteredOutput";
import { RootContext } from "../context/RootContext";

const SearchScreen = () => {
	const [term, setTerm] = useState<string>(``);
	const [filterTerm, setFilterTerm] = useState<string>(``);
	const [searchResults, setSearchResults] = useState<Array<Result>>([]);
	const [filterResults, setFilterResults] = useState<Array<Result>>([]);
	const [city, setCity] = useState<string>(``);
	const { state } = useContext(RootContext);

	console.log(`SearchScreen: state:`, state);

	useEffect(() => {
		console.group(`SearchScreen`)
		console.group(`useEffect`)
		console.log(`city: ${city}`);
		console.groupEnd()
		console.groupEnd()
		setCity(city);
	}, [city]);

	console.group(`SearchScreen`)
	console.log(`city: ${city}`);
	console.groupEnd()
	return (
		<View style={styles.container}>
			<SearchInput
				icon={`search`}
				city={city}
				location={city}
				onTermChange={setTerm}
				placeholder={`What are you craving?`}
				setResults={setSearchResults}
				term={term}
			/>
			<SearchInput
				icon={`filter`}
				city={city}
				location={city}
				onTermChange={setFilterTerm}
				placeholder={`…but you don't want?`}
				setResults={setFilterResults}
				term={filterTerm}
			/>
			<LocationInput
				setCity={setCity}
			/>
			<FilteredOutput term={term} filterTerm={filterTerm} searchResults={searchResults}
							filteredResults={filterResults} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default SearchScreen;
