import { FlatList, Platform, StyleSheet } from "react-native";

import RestaurantCard from "../search/RestaurantCard";
import { Text, View } from "../Themed";
import { BusinessProps, ResultsProps } from "../../hooks/useResults";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ResultsListProps {
	filterTerm: string;
	horizontal?: boolean;
	results: ResultsProps;
	term: string;
}

const ResultsList = ({ filterTerm, horizontal = false, results, term }: ResultsListProps) => {
	const inset = useSafeAreaInsets();
	const hasSearchTerm = term.trim().length > 0;

	const businesses = results.businesses ?? [];
	if (hasSearchTerm && businesses.length === 0) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>We couldn't find anything for {term} :(</Text>
			</View>
		);
	}

	const renderItem = ({ item, index }: { item: BusinessProps, index: number }) => {
		return <RestaurantCard index={index} result={item} />;
	};

	return (
		<View style={styles.container}>
			<FlatList
				contentContainerStyle={styles.contentContainer}
				data={businesses}
				horizontal={horizontal}
				keyExtractor={(result) => result.id}
				renderItem={renderItem}
				showsHorizontalScrollIndicator={false}
			/>
			<StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 10,
	},
	contentContainer: {
		paddingBottom: 420,
	},
	title: {
		fontSize: 18,
		fontWeight: `bold`,
		marginBottom: 5,
	},
});

export default ResultsList;
