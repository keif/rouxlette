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
	if (searchResults?.length === 0 || filteredResults?.length === 0) {
		return null;
	}

	const filterResults = searchResults.filter(searchRes => !filteredResults.find(filteredRes => filteredRes.id === searchRes.id));

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
