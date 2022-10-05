import { Text, View } from "./Themed";
import React from "react";
import { Result } from "../hooks/useResults";
import { StyleSheet } from "react-native";
import ResultsList from "./ResultsList";

interface FilteredOutputProps {
	term: string;
	filterTerm: string;
	searchResults: Array<Result>;
	filteredResults: Array<Result>;
}

const FilteredOutput = ({ term, filterTerm, searchResults, filteredResults }: FilteredOutputProps) => {
	if (searchResults?.length === 0) {
		console.log(`no search results`);
		return (
			<View>
				<Text>Search for something!</Text>
			</View>
		);
	}
	let filterResults;
	console.group(`Component: FilteredOutput`);
	console.log(`term: ${term}`);
	console.log(`filterTerm: ${filterTerm}`);
	console.log(`searchResults:`, searchResults.length);
	console.log(`filteredResults:`, typeof filteredResults, filteredResults.length);
	console.groupEnd();

	if (filteredResults?.length === 0) {
		filterResults = searchResults.filter(searchRes => !filteredResults.find(filteredRes => filteredRes.id === searchRes.id));
	} else {
		filterResults = searchResults;
	}

	if (filterResults.length === 0) {
		return (
			<View>
				<Text>We couldn't find anything :(</Text>
			</View>
		);
	}
	return (
		<View style={styles.container}>
			<Text style={styles.title}>We're looking
				for {term}{filterTerm !== `` ? `, but we don't want ${filterTerm}` : null}</Text>
			<ResultsList
				horizontal={false}
				results={filterResults}
				title={`Maybe try...`}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginRight: 10,
		marginBottom: 10,
		marginLeft: 10,
	},
	title: {
		fontStyle: `italic`,
		fontSize: 16,
		marginBottom: 5,
	},
});

export default FilteredOutput;
