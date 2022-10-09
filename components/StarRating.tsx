import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";

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
						name={name}
						size={20}
						style={starStyle}
					/>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	stars: {
		display: "flex",
		flexDirection: "row",
	},
	starUnselected: {
		color: "#aaa",
	},
	starSelected: {
		color: "#ffb300",
	},
});

export default StarRating;
