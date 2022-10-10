import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Result } from "../../hooks/useResults";
import AppStyles from "../../AppStyles";
import Icon from "react-native-vector-icons/MaterialIcons";
import StarRating from "../shared/StarRating";

interface ResultsDetailProps {
	index: number;
	result: Result;
}

const ResultsDetailListItem = ({ index, result }: ResultsDetailProps) => {
	console.log(`result:`, result);
	const { categories, image_url, is_closed, location, name, price, rating, review_count } = result;
	const { width } = useWindowDimensions();
	const translateY = useRef<Animated.Value>(new Animated.Value(50)).current;
	const opacity = useRef<Animated.Value>(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(translateY, {
				toValue: 0,
				duration: 400,
				delay: (400 / 3),
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 1,
				duration: 400,
				delay: (400 / 3),
				useNativeDriver: true,
			}),
		]).start();
	});

	const openSign = () => {
		if (is_closed) {
			return (
				<Text style={styles.closed}>Closed</Text>
			);
		}

		return (
			<Text style={styles.open}>Open</Text>
		);
	};
	const imageSize = width - 24;
	return (
		<Animated.View
			style={[styles.container, { opacity, transform: [{ translateY }] }]}
		>
			<View style={styles.imageContainer}>
				<Image
					style={{ height: imageSize / 2, width: imageSize }}
					source={{ uri: image_url }}
					resizeMode="cover"
				/>
				<Text style={styles.index}>{index + 1}.</Text>
				<Icon
					style={styles.iconFavorite}
					name="favorite-border"
					size={24}
					color={AppStyles.color.primary}
				/>
			</View>
			<View style={styles.detail}>
				<View style={styles.detailHeader}>
					<Text style={styles.name}>{name}</Text>
					<Text style={{ fontSize: 22, fontFamily: "WorkSans-SemiBold" }}>
						{price}
					</Text>
				</View>
				<View style={{ flexDirection: "row" }}>
					<Text style={styles.subText} numberOfLines={1}>
						{categories.map(cat => cat.title).join(`, `)}
						<View style={{ width: 4 }} />
						<Icon name="location-pin" size={12} color={AppStyles.color.primary} />
						{location.city} - {openSign()}
					</Text>
				</View>
				<View style={{ flexDirection: "row", marginTop: 4 }}>
					<StarRating rating={rating} />
					<Text style={styles.review}>{review_count} Reviews</Text>
				</View>
			</View>
		</Animated.View>
	);
};

const textStyle = {
	color: "rgba(128,128,128, 0.80)",
	fontFamily: "WorkSans-Regular",
};
const styles = StyleSheet.create({
	closed: {
		color: AppStyles.color.closed,
		fontWeight: `bold`,
	},
	container: {
		backgroundColor: AppStyles.color.white,
		borderRadius: 16,
		elevation: 8,
		marginVertical: 12,
		shadowColor: AppStyles.color.shadow,
		shadowOffset: {
			height: 4,
			width: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 12,
	},
	detail: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	detailHeader: {
		flex: 1,
		flexDirection: "row",
	},
	iconFavorite: {
		padding: 16,
		position: "absolute",
		right: 0,
	},
	imageContainer: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		overflow: "hidden",
	},
	image: {
		borderRadius: 10,
		height: `auto`,
		minHeight: 120,
		marginBottom: 5,
		width: `100%`,
	},
	index: {
		color: AppStyles.color.white,
		fontSize: 22,
		fontFamily: "WorkSans-SemiBold",
		fontWeight: `bold`,
		padding: 16,
		position: "absolute",
		left: 0,
		textShadowColor: AppStyles.color.black,
		textShadowOffset: {
			width: 0,
			height: 0,
		},
		textShadowRadius: 6,
	},
	name: {
		color: AppStyles.color.black,
		flex: 1,
		fontSize: 22,
		fontFamily: "WorkSans-SemiBold",
		fontWeight: `bold`,
		paddingBottom: 6,
	},
	open: {
		color: AppStyles.color.open,
		fontWeight: `bold`,
	},
	subText: {
		...textStyle,
		flex: 1,
		paddingRight: 4,
	},
	review: {
		...textStyle,
		marginLeft: 8,
	},
});

export default ResultsDetailListItem;
