import { Text, View } from "../Themed";
import React, { useContext, useEffect, useState } from "react";
import { BusinessProps } from "../../hooks/useResults";
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
	searchResults: Array<BusinessProps>;
	filteredResults: Array<BusinessProps>;
}

const FilteredOutput = ({ term, filterTerm, searchResults, filteredResults }: FilteredOutputProps) => {
	const { state, dispatch } = useContext(RootContext);
	const [searchTerm, setSearchTerm] = useState(term);
	let filterResults;

	if (filteredResults?.length > 0) {
		filterResults = searchResults.filter(searchRes => !filteredResults.find(filteredRes => filteredRes.id === searchRes.id));
	} else {
		filterResults = searchResults;
	}

	const handleFilterPress = () => {
		dispatch(setShowFilter(!state.showFilter));
	};

	useEffect(() => {
		setSearchTerm(term);
	}, [filterResults]);

	return (
		<>
			<View style={styles.container}>
				<View style={{ flexDirection: `row`, marginHorizontal: 12 }}>
					<Text
						style={styles.titleCount}>{filterResults.length} for {term}{filterTerm !== `` ? `, without ${filterTerm}` : null}</Text>
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
		fontStyle: `italic`,
		fontSize: 16,
		marginBottom: 5,
	},
	titleCount: {
		fontSize: 16,
		fontFamily: "WorkSans-Regular",
	},
});

export default FilteredOutput;
