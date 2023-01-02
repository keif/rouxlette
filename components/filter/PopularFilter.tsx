import { Text, View } from "../Themed";
import { Pressable, StyleSheet } from "react-native";
import Config from "../../Config";
import AppStyles from "../../AppStyles";
import Icon from "react-native-vector-icons/MaterialIcons";
import React, { useState } from "react";

const POPULAR_FILTER_LIST = [
	{ titleTxt: "Offering a Deal", isSelected: false },
	{ titleTxt: "Hot and New", isSelected: false },
	{ titleTxt: "Offers Delivery", isSelected: false },
	{ titleTxt: "Open Now", isSelected: false },
];

const PopularFilter = () => {
	const [popularFilterList, setPopularFilterList] = useState(POPULAR_FILTER_LIST);

	// static for now until analytics in play
	const buildPopularList = () => popularFilterList.map(data => (
		<View
			key={data.titleTxt}
			style={styles.listItem}
		>
			<Pressable
				style={({ pressed }) => [
					styles.checkBoxBtn,
					{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
				]}
				android_ripple={{ color: AppStyles.color.greydark }}
				onPress={() => {
					data.isSelected = !data.isSelected;
					setPopularFilterList([...popularFilterList]);
				}}
			>
				<Text style={styles.checkBoxLabel}>
					{data.titleTxt}
				</Text>
				<Icon
					name={data.isSelected ? "check-box" : "check-box-outline-blank"}
					size={25}
					color={data.isSelected ? AppStyles.color.primary : AppStyles.color.greydark}
				/>
			</Pressable>
		</View>
	));

	return (
		<>
			<View style={styles.sectionTitleWrapper}>
				<Text style={styles.sectionTitle}>
					Popular filters
				</Text>
			</View>
			<View style={styles.sectionBodyWrapper}>{buildPopularList()}</View>
		</>
	);
};

const styles = StyleSheet.create({
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
	sectionBodyWrapper: {
		flex: 1,
		flexDirection: `column`,
		paddingHorizontal: 16,
	},
	listItem: {
		backgroundColor: AppStyles.color.black,
		borderRadius: 4,
		flex: 1,
		overflow: "hidden",
	},
	checkBoxBtn: {
		alignSelf: "flex-start",
		alignItems: "center",
		backgroundColor: AppStyles.color.white,
		flexDirection: "row",
		justifyContent: "space-between",
		padding: 8,
		width: `100%`,
	},
	checkBoxLabel: {
		fontFamily: AppStyles.fonts.regular,
		marginStart: 4,
	},
});

export default PopularFilter;
