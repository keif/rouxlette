import { FlatList, StyleSheet, TouchableOpacity } from "react-native";

import ResultsDetailListItem from "./ResultsDetailListItem";
import { useNavigation } from "@react-navigation/native";
import { Text, View } from "../Themed";
import { Result } from "../../hooks/useResults";
import React from "react";
import AppStyles from "../../AppStyles";

interface ResultsListProps {
	filterTerm: string;
	horizontal?: boolean;
	results: Array<Result>;
	term: string;
	title: string;
}

const ResultsList = ({ filterTerm, horizontal = false, results, term, title }: ResultsListProps) => {
	const navigation = useNavigation();

	if (results.length === 0) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>We couldn't find anything :(</Text>
			</View>
		);
	}

	const renderItem = ({ item, index }: { item: Result, index: number }) => (
		<TouchableOpacity
			onPress={() => {
				navigation.navigate(`ResultsShow`, {
					id: item.id,
				});
			}}
		>
			<ResultsDetailListItem index={index} result={item} />
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.titleCount}>{results.length} for {term}{filterTerm !== `` ? `, without ${filterTerm}` : null}</Text>
			<FlatList
				data={results}
				horizontal={horizontal}
				keyExtractor={(result) => result.id}
				renderItem={renderItem}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 10,
	},
	subTitle: {
		borderBottomColor: `#000`,
		borderBottomWidth: 1,
		fontSize: 16,
		fontStyle: `italic`,
		fontWeight: `bold`,
		marginBottom: 5,
		paddingBottom: 5,
	},
	title: {
		fontSize: 18,
		fontWeight: `bold`,
		marginBottom: 5,
	},
	titleCount: {
		fontSize: 16,
		fontFamily: 'WorkSans-Regular',
	},
});

export default ResultsList;
