import { Pressable, StyleSheet } from "react-native";
import Config from "../../Config";
import { Feather } from "@expo/vector-icons";
import React from "react";
import AppStyles from "../../AppStyles";

interface ClearButtonProps {
	onPress: () => void;
}

const ClearButton = ({ onPress }: ClearButtonProps) => {
	// cross Icon, depending on whether the search bar is clicked or not
	return (
		<Pressable
			style={({ pressed }) => [
				styles.buttonClear,
				{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
			]}
			onPress={(props) => onPress()}
			android_ripple={{
				color: "grey",
				borderless: true,
			}}
		>
			<Feather
				name={`x`}
				size={20}
				color="black"
			/>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	buttonClear: {
		color: AppStyles.color.black,
		marginLeft: `auto`,
		shadowColor: AppStyles.input.shadow,
		...AppStyles.Button,
	},
});

export default ClearButton;
