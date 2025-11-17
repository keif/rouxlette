import React, { useEffect, useRef, useState, useContext } from "react";
import { Animated, Image, StyleSheet, Text, useWindowDimensions, View, Linking, Pressable, Platform, ScrollView } from "react-native";
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

// Helper function to format distance
const formatDistance = (meters: number): string => {
	const miles = meters * 0.000621371;
	return `${miles.toFixed(1)} mi`;
};

// Helper function to format hours
const formatHours = (hours: any, is_open_now: boolean): string => {
	if (!hours || !hours[0]?.open) return '';

	const now = new Date();
	const currentDay = now.getDay(); // 0-6, Sunday = 0
	const currentTime = now.getHours() * 100 + now.getMinutes(); // e.g., 1430 for 2:30 PM

	const todayHours = hours[0].open.find((h: any) => h.day === currentDay);

	if (is_open_now && todayHours) {
		const endTime = parseInt(todayHours.end);
		const endHour = Math.floor(endTime / 100);
		const endMin = endTime % 100;
		const period = endHour >= 12 ? 'PM' : 'AM';
		const displayHour = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
		const displayMin = endMin > 0 ? `:${endMin.toString().padStart(2, '0')}` : '';
		return `Open until ${displayHour}${displayMin} ${period}`;
	}

	// Find next opening
	for (let i = 0; i < 7; i++) {
		const checkDay = (currentDay + i) % 7;
		const dayHours = hours[0].open.find((h: any) => h.day === checkDay);
		if (dayHours) {
			const startTime = parseInt(dayHours.start);
			const startHour = Math.floor(startTime / 100);
			const startMin = startTime % 100;
			const period = startHour >= 12 ? 'PM' : 'AM';
			const displayHour = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour;
			const displayMin = startMin > 0 ? `:${startMin.toString().padStart(2, '0')}` : '';

			if (i === 0 && startTime > currentTime) {
				return `Opens at ${displayHour}${displayMin} ${period}`;
			} else if (i === 1) {
				return `Opens tomorrow at ${displayHour}${displayMin} ${period}`;
			}
		}
	}

	return '';
};

const RestaurantCard = ({ index, result }: RestaurantCardProps) => {
	const { categories, hours, image_url, is_closed, location, name, price, rating, review_count, url, phone, display_phone, photos, distance } = result;
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
	const cardMinHeight = imageSize / 2 + 120; // Image height + approximate detail section height

	// Format additional info for back card
	const distanceText = distance ? formatDistance(distance) : '';
	const hoursText = formatHours(hours, is_open_now);
	const quickInfo = [price, distanceText, hoursText].filter(Boolean).join(' • ');

	// Debug logging
	logSafe(`RestaurantCard ${name}`, {
		photosCount: photos?.length || 0,
		quickInfo,
		is_open_now,
		hoursText,
		categoriesCount: categories.length
	});

	const frontContent = (
		<View style={[styles.cardContent, { minHeight: cardMinHeight }]}>
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
				<View style={{ flexDirection: "row", marginTop: 4 }}>
					<StarRating rating={rating} />
					<Text style={styles.review}>{review_count} Reviews</Text>
				</View>
			</View>
			<Pressable
				style={styles.flipButtonCorner}
				onPress={() => setIsFlipped(true)}
				android_ripple={{
					color: "rgba(0,0,0,0.1)",
					radius: 24,
					borderless: true,
				}}
				accessibilityLabel="View details"
			>
				<MaterialIcons name="info" size={28} color={AppStyles.color.primary} />
			</Pressable>
		</View>
	);

	const backContent = (
		<View style={[styles.cardContent, { minHeight: cardMinHeight }]}>
			<View style={styles.backHeader}>
				<Text style={styles.backTitle}>{name}</Text>
				<OpenSign is_open_now={is_open_now} />
			</View>

			{quickInfo && (
				<View style={styles.quickInfo}>
					<Text style={styles.quickInfoText}>{quickInfo}</Text>
				</View>
			)}

			<View style={styles.backRating}>
				<StarRating rating={rating} />
				<Text style={styles.backReviewText}>{review_count} Review{review_count > 1 ? 's' : ''}</Text>
			</View>

			{photos && photos.length > 0 && (
				<View style={styles.photoContainer}>
					{photos.slice(0, 3).map((photo, idx) => (
						<Image
							key={idx}
							source={{ uri: photo }}
							style={styles.photo}
							resizeMode="cover"
						/>
					))}
				</View>
			)}

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

			<View style={{ flex: 1 }} />

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

				<Pressable
					style={styles.flipButtonInline}
					onPress={() => setIsFlipped(false)}
					android_ripple={{
						color: "rgba(0,0,0,0.1)",
						radius: 24,
						borderless: true,
					}}
					accessibilityLabel="Close details"
				>
					<MaterialIcons name="rotate-left" size={28} color={AppStyles.color.primary} />
				</Pressable>
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
				disableSwipeToFlip={true}
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
		// Empty - let content handle its own styling for 3D flip effect
	},
	cardContent: {
		borderRadius: 16,
		overflow: 'hidden',
		backgroundColor: AppStyles.color.white,
		borderWidth: 1,
		borderColor: 'rgba(0, 0, 0, 0.08)',
		elevation: 12,
		shadowColor: '#000',
		shadowOffset: {
			height: 6,
			width: 0,
		},
		shadowOpacity: 0.15,
		shadowRadius: 8,
	},
	detail: {
		backgroundColor: AppStyles.color.white,
		paddingHorizontal: 16,
		paddingVertical: 6,
		paddingBottom: 16,
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
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: AppStyles.color.primary,
	},
	backTitle: {
		color: AppStyles.color.white,
		fontSize: 20,
		fontFamily: AppStyles.fonts.semiBold,
		fontWeight: 'bold',
		flex: 1,
	},
	quickInfo: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 4,
	},
	quickInfoText: {
		fontSize: 14,
		fontFamily: AppStyles.fonts.medium,
		color: AppStyles.color.black,
	},
	backRating: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingTop: 2,
	},
	backReviewText: {
		...textStyle,
		marginLeft: 8,
	},
	backDetails: {
		paddingHorizontal: 16,
		paddingVertical: 6,
	},
	backDetailText: {
		...textStyle,
		fontSize: 15,
		marginBottom: 6,
		lineHeight: 20,
	},
	backActions: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 8,
		paddingHorizontal: 16,
		paddingBottom: 12,
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
	photoContainer: {
		flexDirection: 'row',
		gap: 8,
		paddingHorizontal: 16,
		marginVertical: 8,
	},
	photo: {
		flex: 1,
		height: 80,
		borderRadius: 8,
		maxWidth: 120,
	},
	flipButtonCorner: {
		position: 'absolute',
		bottom: 12,
		right: 12,
		backgroundColor: 'transparent',
		borderRadius: 24,
		width: 48,
		height: 48,
		justifyContent: 'center',
		alignItems: 'center',
	},
	flipButtonInline: {
		backgroundColor: 'transparent',
		borderRadius: 24,
		width: 48,
		height: 48,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 'auto',
	},
});

export default RestaurantCard;