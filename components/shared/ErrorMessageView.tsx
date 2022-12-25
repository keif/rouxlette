import { Text, View } from "../Themed";
import { StyleSheet } from "react-native";
import React from "react";

interface ErrorMessageViewProps {
	text: string;
}

const ErrorMessageView = ({ text }: ErrorMessageViewProps) => {
	return (
		<View style={styles.view}>
			<Text>{text}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	view: {
		paddingHorizontal: 16,
		width: `100%`,
	},
});

export default ErrorMessageView;
