import { Pressable, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import React from "react";
import AppStyles from "../../AppStyles";
import Config from "../../Config";

interface PriceBtn {
	idx: number;
	selectedFilter: string;
	onPress: () => void;
}

const PriceButton = ({ idx, selectedFilter, onPress }: PriceBtn) => {
	const isSelected = selectedFilter === idx.toString();
	return (
		<View style={styles(isSelected).filterBtnContainer}>
			<Pressable
				android_ripple={{ color: "lightgrey" }}
				onPress={onPress}
				style={
					({ pressed }) => [
						{
							opacity: !Config.isAndroid && pressed ? 0.6 : 1
						}
					]
				}
			>
				<View style={styles(isSelected).filterBtnText}>
				{Array.from(Array(idx + 1).keys()).map(key => (
					<Icon key={key} name={`attach-money`} size={18} style={[styles(isSelected).filterIcon]} />
				))}
				</View>
			</Pressable>
		</View>
	);
};
const styles = (selected: boolean) =>
	StyleSheet.create({
		filterBtnContainer: {
			backgroundColor: selected ? AppStyles.color.primary : "transparent",
			borderColor: AppStyles.color.primary,
			borderRadius: 24,
			borderWidth: 1,
			flex: 1,
			marginHorizontal: 8,
			overflow: "hidden",
		},
		filterBtnText: {
			flexDirection: `row`,
			fontSize: 12,
			fontFamily: "WorkSans-SemiBold",
			justifyContent: `space-evenly`,
			paddingHorizontal: 18,
			paddingVertical: 12,
		},
		filterIcon: {
			color: selected ? AppStyles.color.white : AppStyles.color.primary,
		}
	});

export default PriceButton;
