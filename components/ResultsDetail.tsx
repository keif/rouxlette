import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Result } from "../hooks/useResults";

interface ResultsDetailProps {
	result: Result;
}

const ResultsDetail = ({ result }: ResultsDetailProps) => {
	const { image_url, name, rating, review_count } = result;
	return (
		<View style={styles.container}>
			{image_url ? <Image
				source={{ uri: image_url }}
				style={styles.image}
			/> : null}
			<Text
				style={styles.name}
			>{name}</Text>
			<Text style={styles.name}>{rating} Stars, {review_count} Reviews</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		borderBottomColor: `#000`,
		borderBottomWidth: 1,
		marginBottom: 15,
		paddingBottom: 15,
	},
	image: {
		borderRadius: 10,
		height: `auto`,
		minHeight: 120,
		marginBottom: 5,
		width: `100%`,
	},
	name: {
		color: `#000`,
		fontWeight: `bold`,
	},
});

export default ResultsDetail;
