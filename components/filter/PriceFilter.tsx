import { StyleSheet, View } from "react-native";
import { Text } from "../Themed";
import React, { useContext } from "react";
import AppStyles from "../../AppStyles";
import PriceButton from "./PriceButton";
import { RootContext } from "../../context/RootContext";
import { setFilter } from "../../context/reducer";

interface PriceFilterProps {
}

const PriceFilter = ({ }: PriceFilterProps) => {
	const { state, dispatch } = useContext(RootContext);
	const hasFilter = (key: number) => (state?.filter?.price && state?.filter?.price?.indexOf(key) > -1) ? key : -1;

	const handleOnPress = (key: number) => {
		const idxInFilter = state?.filter?.price && state.filter.price.indexOf(key);
		let newFilter;
		if (typeof idxInFilter === `number` && idxInFilter > -1) {
			// remove if present
			newFilter = {
				...state?.filter,
				price: state?.filter?.price?.filter(num => num !== key),
			};
		} else {
			// add if not
			newFilter = {
				...state?.filter,
				price: (state?.filter?.price && state?.filter?.price.concat(key) || [key]),
			};
		}
		dispatch(setFilter(newFilter));
	};

	return (
		<>
			<View style={styles.sectionTitleWrapper}>
				<Text style={styles.sectionTitle}>Price:</Text>
			</View>
			<View style={styles.priceRowContainer}>
				{Array.from(Array(4).keys()).map(key => (
					<PriceButton key={key} idx={key} selectedFilter={hasFilter(key)} onPress={() => handleOnPress(key)} />
				))}
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	priceRowContainer: {
		flexDirection: "row",
		paddingVertical: 16,
		marginBottom: 8,
	},
	sectionTitleWrapper: {
		paddingHorizontal: 16,
	},
	sectionTitle: {
		color: AppStyles.color.black,
		fontFamily: AppStyles.fonts.bold,
		fontSize: 18,
		fontWeight: `400`,
		paddingVertical: 12,
	},
	sectionSubTitle: {
		fontFamily: AppStyles.fonts.regular,
	}
});

export default PriceFilter;
