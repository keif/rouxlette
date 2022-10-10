import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import AppStyles from "../../AppStyles";

interface StarRatingProps {
	rating: number;
}

const StarRating = ({ rating }: StarRatingProps) => {
	const starRatingOptions = [1, 2, 3, 4, 5];

	return (
		<View style={styles.stars}>
			{starRatingOptions.map((option, index) => {
				let name = `star-border`;
				let starStyle = styles.starUnselected;
				if (rating >= option) {
					name = `star`;
					starStyle = styles.starSelected;
				} else if (option === Math.floor(rating) + 1) {
					name = `star-half`;
					starStyle = styles.starSelected;
				}
				return (
					<MaterialIcons
						key={index}
						// @ts-ignore
						name={name}
						size={20}
						style={starStyle}
					/>
				);
			})}
		</View>
	);
};

const starStyle = {
	textShadowColor: AppStyles.color.black,
	textShadowOffset: {
		height: 1,
		width: 1
	},
	textShadowRadius: 2,
}
const styles = StyleSheet.create({
	stars: {
		display: "flex",
		flexDirection: "row",
	},
	starSelected: {
		...starStyle,
		color: "#ffb300",
	},
	starUnselected: {
		...starStyle,
		color: "#aaa",
	},
});

export default StarRating;
