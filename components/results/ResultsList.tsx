import { ScrollView, Platform, StyleSheet, ActivityIndicator } from "react-native";

import RestaurantCardDetailed from "../search/RestaurantCardDetailed";
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
	isLoading?: boolean;
	ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
}

const ResultsList = ({ filterTerm, horizontal = false, results, term, isLoading = false, ListHeaderComponent }: ResultsListProps) => {
	const inset = useSafeAreaInsets();
	const hasSearchTerm = term.trim().length > 0;

	const businesses = results.businesses ?? [];
	const isSearching = isLoading && businesses.length === 0 && hasSearchTerm;

	if (isSearching) {
		return (
			<View style={[styles.container, styles.centered]}>
				<ActivityIndicator size="large" />
				<Text style={styles.searchingLabel}>Searching…</Text>
			</View>
		);
	}

	if (hasSearchTerm && businesses.length === 0) {
		return (
			<View style={[styles.container, styles.centered]}>
				<Text style={styles.title}>We couldn’t find anything for “{term}”.</Text>
				<Text style={styles.subtitle}>Try a broader term or remove some filters.</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(200, 160 + inset.bottom) }]}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={true}
			>
				{ListHeaderComponent}
				{businesses.map((business, index) => (
					<RestaurantCardDetailed key={business.id} index={index} result={business} />
				))}
			</ScrollView>
			<StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
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
	centered: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 24,
	},
	searchingLabel: {
		marginTop: 10,
		fontSize: 16,
	},
	subtitle: {
		marginTop: 6,
		fontSize: 14,
		opacity: 0.7,
		textAlign: 'center',
	},
});

export default ResultsList;
