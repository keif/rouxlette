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
		console.debug(`no results`);
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Search for something!</Text>
			</View>
		);
	}
	let filterResults;

	if (filteredResults?.length > 0) {
		filterResults = searchResults.filter(searchRes => !filteredResults.find(filteredRes => filteredRes.id === searchRes.id));
	} else {
		filterResults = searchResults;
	}

	return (
		<View style={styles.container}>
			<ResultsList
				filterTerm={filterTerm}
				horizontal={false}
				results={filterResults}
				term={term}
				title={`Maybe try...`}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 12,
	},
	title: {
		fontStyle: `italic`,
		fontSize: 16,
		marginBottom: 5,
	},
});

export default FilteredOutput;
