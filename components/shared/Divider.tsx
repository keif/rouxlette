import { StyleSheet, View } from "react-native";
import React from "react";
import AppStyles from "../../AppStyles";

const Divider = () => {
	return (
		<View style={styles.divider} />
	);
};

const styles = StyleSheet.create({
	divider: {
		backgroundColor: AppStyles.color.greydark,
		height: StyleSheet.hairlineWidth,
	},
});

export default Divider;
