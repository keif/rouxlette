import { Text, View } from "../Themed";
import React, { useContext, useEffect, useState } from "react";
import { ResultsProps } from "../../hooks/useResults";
import { Pressable, StyleSheet } from "react-native";
import ResultsList from "../results/ResultsList";
import Config from "../../Config";
import Icon from "react-native-vector-icons/MaterialIcons";
import AppStyles from "../../AppStyles";
import { setShowFilter } from "../../context/reducer";
import { RootContext } from "../../context/RootContext";
import FilterModal from "../filter/FilterModal";

interface FilteredOutputProps {
	term: string;
	filterTerm: string;
	searchResults: ResultsProps;
	filteredResults: ResultsProps;
}

const FilteredOutput = ({ term, filterTerm, searchResults, filteredResults }: FilteredOutputProps) => {
	const { state, dispatch } = useContext(RootContext);
	const [searchTerm, setSearchTerm] = useState(term);
	let filterResults;
	const hasSearchTerm = term.trim().length > 0;

	const filteredBusinesses = filteredResults?.businesses ?? [];
	const searchBusinesses = searchResults?.businesses ?? [];
	
	if (filteredBusinesses.length > 0) {
		// filterResults = searchResults.filter(searchRes => !filteredResults.find(filteredRes => filteredRes.id !== searchRes.id));
		filterResults = { ...filteredResults, businesses: filteredBusinesses };
	} else {
		filterResults = { ...searchResults, businesses: searchBusinesses };
	}

	const handleFilterPress = () => {
		dispatch(setShowFilter(!state.showFilter));
	};

	useEffect(() => {
		setSearchTerm(term);
	}, [filterResults.id]);

	if (!hasSearchTerm) {
		return null;
	}

	return (
		<>
			<View style={styles.container}>
				<View style={{ flexDirection: `row`, marginHorizontal: 12 }}>
					<Text
						style={styles.titleCount}>{(filterResults.businesses ?? []).length.toString()} for {term}{filterTerm !== `` ? `, without ${filterTerm}` : ``}</Text>
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
				<ResultsList
					filterTerm={filterTerm}
					horizontal={false}
					results={filterResults}
					term={term}
				/>
			</View>
			<FilterModal />
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingVertical: 8,
	},
	button: {
		marginLeft: `auto`,
		flexDirection: `row`,
	},
	filterText: {
		fontSize: 16,
		fontFamily: AppStyles.fonts.regular,
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
		fontStyle: `italic`,
		fontSize: 16,
		marginBottom: 5,
	},
	titleCount: {
		fontSize: 16,
		fontFamily: AppStyles.fonts.regular,
	},
});

export default FilteredOutput;
