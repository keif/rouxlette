import React, { useEffect, useRef, useState, useContext } from "react";
import { Animated, Image, StyleSheet, Text, useWindowDimensions, View, Linking, Pressable, Platform } from "react-native";
import { BusinessProps } from "../../hooks/useResults";
import AppStyles from "../../AppStyles";
import {FontAwesome, MaterialIcons as Icon, Ionicons, MaterialIcons} from "@expo/vector-icons";
import StarRating from "../shared/StarRating";
import OpenSign from "../results/OpenSign";
import FlipCard from "../shared/FlipCard";
import Config from "../../Config";
import { logSafe } from "../../utils/log";
import { useFavorites } from "../../hooks/useFavorites";
import { useHistory } from "../../hooks/useHistory";
import { RootContext } from '../../context/RootContext';

interface RestaurantCardProps {
	index: number;
	result: BusinessProps;
}

const RestaurantCard = ({ index, result }: RestaurantCardProps) => {
	const { categories, hours, image_url, is_closed, location, name, price, rating, review_count, url, phone, display_phone, photos } = result;
	const { width } = useWindowDimensions();
	const translateY = useRef<Animated.Value>(new Animated.Value(50)).current;
	const opacity = useRef<Animated.Value>(new Animated.Value(0)).current;
	const is_open_now = hours && hours[0]?.is_open_now || false;
	const { isFavorite, toggleFavorite } = useFavorites();
	const { addHistoryEntry } = useHistory();
	const { state } = useContext(RootContext);
	const [isFlipped, setIsFlipped] = useState(false);

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
	}, []);

	const handleYelpPress = () => {
		// Track this as a manual selection when user opens Yelp
		addHistoryEntry({
			business: result,
			source: 'manual',
			context: {
				locationText: state.location,
				filters: {
					openNow: state.filters.openNow,
					categories: state.filters.categoryIds,
					priceLevels: state.filters.priceLevels,
					radiusMeters: state.filters.radiusMeters,
					minRating: state.filters.minRating,
				},
			},
		});
		
		Linking
			.openURL(url)
			.catch((err: any) => logSafe("RestaurantCard Yelp link error", { message: err?.message, url }));
	};

	const handlePhonePress = () => {
		if (phone) {
			Linking.openURL(`tel:${phone}`);
		}
	};

	const handleMapsPress = () => {
		// Track this as a manual selection when user opens Maps
		addHistoryEntry({
			business: result,
			source: 'manual',
			context: {
				locationText: state.location,
				filters: {
					openNow: state.filters.openNow,
					categories: state.filters.categoryIds,
					priceLevels: state.filters.priceLevels,
					radiusMeters: state.filters.radiusMeters,
					minRating: state.filters.minRating,
				},
			},
		});
		
		const address = location.display_address.join(', ');
		const encodedAddress = encodeURIComponent(address);
		
		if (Platform.OS === 'ios') {
			Linking.openURL(`http://maps.apple.com/?q=${encodedAddress}`);
		} else {
			Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
		}
	};

	const imageSize = width - 24;

	const frontContent = (
		<View style={styles.cardContent}>
			<View style={styles.imageContainer}>
				<Image
					style={{ height: imageSize / 2, width: imageSize }}
					source={{ uri: image_url }}
					resizeMode="cover"
				/>
				<Text style={styles.index}>{index + 1}.</Text>
				<Pressable
					style={styles.favoriteButton}
					onPress={() => toggleFavorite(result)}
					android_ripple={{
						color: "rgba(255,255,255,0.3)",
						radius: 20,
						borderless: true,
					}}
					accessibilityLabel={isFavorite(result.id) ? "Remove from favorites" : "Add to favorites"}
				>
					<Ionicons
						name={isFavorite(result.id) ? "heart" : "heart-outline"}
						size={24}
						color={isFavorite(result.id) ? AppStyles.color.yelp : AppStyles.color.white}
						style={styles.iconFavorite}
					/>
				</Pressable>
			</View>
			<View style={styles.detail}>
				<View style={styles.detailHeader}>
					<Text style={styles.name}>{name}</Text>
					<Text style={{ fontSize: 22, fontFamily: AppStyles.fonts.semiBold, }}>
						{price}
					</Text>
				</View>
				<View style={{ flexDirection: "row" }}>
					<Text style={styles.subText} numberOfLines={1}>
						{categories.map(cat => cat.title).join(`, `)} • {location.city}
					</Text>
				</View>
				<View style={{ flexDirection: "row", marginTop: 4, alignItems: 'center' }}>
					<StarRating rating={rating} />
					<Text style={styles.review}>{review_count} Reviews</Text>
					<Pressable
						style={styles.flipButton}
						onPress={() => setIsFlipped(true)}
						android_ripple={{
							color: "rgba(0,0,0,0.1)",
							radius: 20,
							borderless: true,
						}}
						accessibilityLabel="View details"
					>
						<MaterialIcons name="info" size={24} color={AppStyles.color.primary} />
					</Pressable>
				</View>
			</View>
		</View>
	);

	const backContent = (
		<View style={styles.cardContent}>
			<View style={styles.backHeader}>
				<Text style={styles.backTitle}>{name}</Text>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
					<OpenSign is_open_now={is_open_now} />
					<Pressable
						onPress={() => setIsFlipped(false)}
						android_ripple={{
							color: "rgba(255,255,255,0.3)",
							radius: 20,
							borderless: true,
						}}
						accessibilityLabel="Close details"
						style={styles.closeButton}
					>
						<MaterialIcons name="close" size={24} color={AppStyles.color.white} />
					</Pressable>
				</View>
			</View>
			
			<View style={styles.backRating}>
				<StarRating rating={rating} />
				<Text style={styles.backReviewText}>{review_count} Review{review_count > 1 ? 's' : ''}</Text>
			</View>

			<View style={styles.backDetails}>
				<Text style={styles.backDetailText}>
					<MaterialIcons name="location-on" size={16} color={AppStyles.color.primary} />
					{' '}{location.display_address.join(', ')}
				</Text>
				
				{phone && (
					<Text style={styles.backDetailText}>
						<MaterialIcons name="phone" size={16} color={AppStyles.color.primary} />
						{' '}{display_phone}
					</Text>
				)}

				<Text style={styles.backDetailText}>
					<MaterialIcons name="category" size={16} color={AppStyles.color.primary} />
					{' '}{categories.map(cat => cat.title).join(', ')}
				</Text>
			</View>

			<View style={styles.backActions}>
				<Pressable
					style={({ pressed }) => [
						styles.backButton,
						{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
					]}
					onPress={handleMapsPress}
					android_ripple={{
						color: "grey",
						radius: 28,
						borderless: true,
					}}
				>
					<MaterialIcons
						color={AppStyles.color.primary}
						name="map"
						size={20}
					/>
					<Text style={styles.backButtonText}>Maps</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [
						styles.backButton,
						{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
					]}
					onPress={handleYelpPress}
					android_ripple={{
						color: "grey",
						radius: 28,
						borderless: true,
					}}
				>
					<FontAwesome
						color={AppStyles.color.yelp}
						name="yelp"
						size={20}
					/>
					<Text style={styles.backButtonText}>Yelp</Text>
				</Pressable>

				{phone && (
					<Pressable
						style={({ pressed }) => [
							styles.backButton,
							{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
						]}
						onPress={handlePhonePress}
						android_ripple={{
							color: "grey",
							radius: 28,
							borderless: true,
						}}
					>
						<MaterialIcons
							color={AppStyles.color.phone}
							name="phone-in-talk"
							size={20}
						/>
						<Text style={styles.backButtonText}>Call</Text>
					</Pressable>
				)}
			</View>
		</View>
	);

	return (
		<Animated.View
			style={[styles.container, { opacity, transform: [{ translateY }] }]}
		>
			<FlipCard
				front={frontContent}
				back={backContent}
				style={styles.flipCard}
				flipped={isFlipped}
				onFlipChange={setIsFlipped}
				disableTapToFlip={true}
			/>
		</Animated.View>
	);
};

const textStyle = {
	color: "rgba(128,128,128, 0.80)",
	fontFamily: AppStyles.fonts.regular,
};

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 12,
		marginVertical: 12,
	},
	flipCard: {
		backgroundColor: AppStyles.color.white,
		borderRadius: 16,
		elevation: 8,
		shadowColor: AppStyles.color.shadow,
		shadowOffset: {
			height: 4,
			width: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 12,
	},
	cardContent: {
		borderRadius: 16,
		overflow: 'hidden',
		backgroundColor: AppStyles.color.white,
	},
	detail: {
		backgroundColor: AppStyles.color.white,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	detailHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	favoriteButton: {
		padding: 8,
		position: "absolute",
		right: 8,
		top: 8,
		backgroundColor: "rgba(0,0,0,0.2)",
		borderRadius: 20,
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	iconFavorite: {
		textShadowColor: AppStyles.color.black,
		textShadowOffset: {
			width: 0,
			height: 0,
		},
		textShadowRadius: 4,
	},
	imageContainer: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		overflow: "hidden",
	},
	index: {
		color: AppStyles.color.white,
		fontSize: 22,
		fontFamily: AppStyles.fonts.semiBold,
		fontWeight: "bold",
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
		fontFamily: AppStyles.fonts.semiBold,
		fontWeight: "bold",
		paddingBottom: 6,
		paddingRight: 8,
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
	// Back of card styles
	backHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: AppStyles.color.primary,
	},
	backTitle: {
		color: AppStyles.color.white,
		fontSize: 20,
		fontFamily: AppStyles.fonts.semiBold,
		fontWeight: 'bold',
		flex: 1,
	},
	backRating: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	backReviewText: {
		...textStyle,
		marginLeft: 8,
	},
	backDetails: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	backDetailText: {
		...textStyle,
		fontSize: 16,
		marginBottom: 8,
		lineHeight: 22,
	},
	backActions: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 16,
		paddingHorizontal: 16,
	},
	backButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		shadowColor: AppStyles.input.shadow,
		...AppStyles.ButtonPressable,
        borderRadius: 20,
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	backButtonText: {
		marginLeft: 6,
		fontSize: 14,
		fontFamily: AppStyles.fonts.medium,
		color: AppStyles.color.black,
	},
	flipButton: {
		marginLeft: 'auto',
		padding: 4,
	},
	closeButton: {
		padding: 4,
	},
});

export default RestaurantCard;