import React, { useEffect, useRef, useState } from "react";
import {
	Animated,
	Dimensions,
	FlatList,
	Image,
	Linking,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	useWindowDimensions,
} from "react-native";
import yelp from "../api/yelp";
import { ResultsShowScreenProps } from "../types";
import { Result } from "../hooks/useResults";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AppStyles from "../AppStyles";
import { View } from "../components/Themed";
import StarRating from "../components/shared/StarRating";
import Config from "../Config";
import OpenSign from "../components/results/OpenSign";

const ResultsShowScreen = ({ navigation, route }: ResultsShowScreenProps<`ResultsShow`>) => {
	const [result, setResult] = useState<Result>();
	const { width } = useWindowDimensions();
	const translateY = useRef<Animated.Value>(new Animated.Value(50)).current;
	const opacity = useRef<Animated.Value>(new Animated.Value(0)).current;
	const is_open_now = result?.hours && result.hours[0].is_open_now || false;

	useEffect(() => {
		const getResult = async (id: string) => {
			try {
				const response = await yelp.get(`/${id}`);
				setResult(response.data);
			} catch (err) {
				console.warn(err);
			}
		};

		if (route?.params?.id) {
			getResult(route.params.id);
		}
	}, [route?.params?.id]);

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

	if (!result) {
		return null;
	}

	const handleIconPress = () => {
		Linking
			.openURL(result.url)
			.catch((err) => console.error("An error occurred:", err));
	};

	const handlePhonePress = () => {
		Linking.openURL(`tel:${result.phone}`);
	};

	const imageSize = width - 24;

	return (
		<Animated.View
			style={[styles.container, { opacity, transform: [{ translateY }] }]}
		>
			<View style={styles.imageContainer}>
				<FlatList
					data={result.photos}
					decelerationRate={"fast"}
					horizontal
					keyExtractor={(photo) => photo}
					renderItem={({ item }) => (
						<Image
							source={{ uri: item }}
							style={[styles.image, { height: imageSize / 2, width: imageSize }]}
							resizeMode="cover"
						/>
					)}
					snapToAlignment={"start"}
					snapToInterval={Dimensions.get("window").width}
				/>
				<Text style={styles.title}>{result.name}</Text>
				<Text style={styles.price}><OpenSign is_open_now={is_open_now} /></Text>
				<View style={styles.starRating}>
					<StarRating rating={result.rating} shadow />
					<Text>{result.review_count} Review{result.review_count > 1 ? `s` : null}</Text>
				</View>
			</View>

			<View style={styles.action}>
				<Pressable
					style={({ pressed }) => [
						styles.button,
						{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
					]}
					onPress={handleIconPress}
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
				</Pressable>
				<Pressable
					style={({ pressed }) => [
						styles.button,
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
						name={`phone-in-talk`}
						size={20}
					/>
					<Text>{result.display_phone}</Text>
				</Pressable>
			</View>
			<ScrollView style={styles.codeblock}>
				<Text>is_closed: {result.is_closed.toString()}</Text>
				<Text>Address: {result.location.display_address.join(`, `)}</Text>
			</ScrollView>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	action: {
		flexDirection: `row`,
		justifyContent: "space-around",
		paddingVertical: 24,
	},
	button: {
		backgroundColor: `rgba(255, 255, 255, 0.69)`,
		flexDirection: `row`,
		shadowColor: AppStyles.input.shadow,
		...AppStyles.Button,
	},
	codeblock: {
		marginLeft: 10,
		marginRight: 10,
	},
	container: {
		flex: 1,
	},
	imageContainer: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		overflow: "hidden",
	},
	image: {
		height: 200,
		width: 300,
	},
	price: {
		position: `absolute`,
		right: 12,
		top: 12,
	},
	starRating: {
		backgroundColor: `transparent`,
		bottom: 12,
		flexDirection: `row`,
		left: 12,
		position: `absolute`,
	},
	title: {
		color: AppStyles.color.white,
		fontSize: 24,
		fontWeight: `bold`,
		left: 16,
		position: `absolute`,
		textShadowColor: AppStyles.color.black,
		textShadowOffset: {
			width: 0,
			height: 0,
		},
		textShadowRadius: 6,
		top: 16,
	},
});

export default ResultsShowScreen;
