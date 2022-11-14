import { StyleSheet, View } from "react-native";
import { Text } from "../Themed";
import React, { Dispatch, SetStateAction } from "react";
import AppStyles from "../../AppStyles";
import PriceButton from "./PriceButton";
import { Result } from "../../hooks/useResults";

interface PriceFilterProps {
	priceFilter: string;
	setPriceFilter: Dispatch<SetStateAction<string>>;
}

const PriceFilter = ({ priceFilter, setPriceFilter}: PriceFilterProps) => {
	const pricing = [];
	console.log(`priceFilter: ${priceFilter}`)
	return (
		<>
			<View style={styles.sectionTitleWrapper}>
				<Text style={styles.sectionTitle}>Price{priceFilter ?? ``}</Text>
			</View>
			<View style={styles.priceRowContainer}>
				{Array.from(Array(4).keys()).map(key => (
					<PriceButton key={key.toString()} idx={key} selectedFilter={priceFilter} onPress={() => setPriceFilter(key.toString())} />
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
		fontFamily: "WorkSans-Regular",
		fontSize: 18,
		fontWeight: `800`,
	},
});

export default PriceFilter;
