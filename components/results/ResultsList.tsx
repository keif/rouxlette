import { FlatList, Pressable, StyleSheet, TouchableOpacity } from "react-native";

import ResultsDetailListItem from "./ResultsDetailListItem";
import { useNavigation } from "@react-navigation/native";
import { Text, View } from "../Themed";
import { Result } from "../../hooks/useResults";
import React, { useEffect, useState } from "react";
import AppStyles from "../../AppStyles";
import Icon from "react-native-vector-icons/MaterialIcons";
import { MaterialIcons } from "@expo/vector-icons";
import Config from "../../Config";

interface ResultsListProps {
	filterTerm: string;
	horizontal?: boolean;
	results: Array<Result>;
	term: string;
}

const ResultsList = ({ filterTerm, horizontal = false, results, term }: ResultsListProps) => {
	const [searchTerm, setSearchTerm] = useState(term);
	const navigation = useNavigation();

	if (results.length === 0) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>We couldn't find anything :(</Text>
			</View>
		);
	}

	const handleFilterPress = () => {
		console.log(`filter`);
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

	useEffect(() => {
		setSearchTerm(term);
	}, [results]);

	return (
		<View style={styles.container}>
			<View style={{ flexDirection: `row`, marginHorizontal: 12, }}>
				<Text
					style={styles.titleCount}>{results.length} for {searchTerm}{filterTerm !== `` ? `, without ${filterTerm}` : null}</Text>
				<Pressable
					style={({ pressed }) => [
						styles.button,
						{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
					]}
					onPress={handleFilterPress}
					android_ripple={{
						color: "grey",
						radius: 28,
						borderless: true,
					}}
				>
					<Text
						style={styles.filterText}>Filters/Don't want?
					</Text>
					<Icon name={`filter-list`} size={20} color={AppStyles.color.primary} />
				</Pressable>
			</View>
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
	button: {
		marginLeft: `auto`,
		flexDirection: `row`,
	},
	filterText: {
		fontSize: 16,
		fontFamily: "WorkSans-Regular",
		marginLeft: `auto`,
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
		fontFamily: "WorkSans-Regular",
	},
});

export default ResultsList;
