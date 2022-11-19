import { FlatList, Platform, StyleSheet, TouchableOpacity } from "react-native";

import ResultsDetailListItem from "./ResultsDetailListItem";
import { useNavigation } from "@react-navigation/native";
import { Text, View } from "../Themed";
import { BusinessProps } from "../../hooks/useResults";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ResultsListProps {
	filterTerm: string;
	horizontal?: boolean;
	results: Array<BusinessProps>;
	term: string;
}

const ResultsList = ({ filterTerm, horizontal = false, results, term }: ResultsListProps) => {
	const navigation = useNavigation();
	const inset = useSafeAreaInsets();

	if (results.length === 0) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>We couldn't find anything :(</Text>
			</View>
		);
	}

	const renderItem = ({ item, index }: { item: BusinessProps, index: number }) => (
		<TouchableOpacity
			onPress={() => {
				navigation.navigate(`Modal`, {
					id: item.id,
					name: item.name,
				});
			}}
		>
			<ResultsDetailListItem index={index} result={item} />
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<FlatList
				contentContainerStyle={styles.contentContainer}
				data={results}
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
		// flex: 1,
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
