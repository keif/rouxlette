import { FlatList, StyleSheet, TouchableOpacity } from "react-native";

import ResultsDetail from "./ResultsDetail";
import { useNavigation } from "@react-navigation/native";
import { Text, View } from "./Themed";
import { Result } from "../hooks/useResults";

interface ResultsListProps {
	horizontal?: boolean;
	results: Array<Result>;
	title: string;
}

const ResultsList = ({ horizontal = false, results, title }: ResultsListProps) => {
	const navigation = useNavigation();

	if (!results.length) {
		return null;
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>We found {results.length} results</Text>
			<Text style={styles.title}>{title}</Text>
			<FlatList
				data={results}
				horizontal={horizontal}
				keyExtractor={(result) => result.id}
				renderItem={({ item }) => (
					<TouchableOpacity
						onPress={() => {
							navigation.navigate(`ResultsShow`, {
								id: item.id,
							});
						}}
					>
						<ResultsDetail result={item} />
					</TouchableOpacity>
				)}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 10,
		paddingLeft: 8,
	},
	title: {
		fontSize: 18,
		fontWeight: `bold`,
		marginBottom: 5,
		marginLeft: 15,
	},
});

export default ResultsList;
