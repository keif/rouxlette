import { Entypo } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import useLocation from "../../hooks/useLocation";
import { Text } from "../Themed";
import { RootContext } from "../../context/RootContext";
import { setLocation } from "../../context/reducer";
import Config from "../../Config";
import AppStyles from "../../AppStyles";

interface LocationInputProps {
	location: string;
	setCity: Dispatch<SetStateAction<string>>;
}

const LocationInput = ({ location, setCity }: LocationInputProps) => {
	const { state, dispatch } = useContext(RootContext);
	const [locationErrorMessage, city, locationResults, searchLocation] = useLocation();
	const [locale, setLocale] = useState<string>(``);

	const fetchLocation = async (location: string) => {
		await searchLocation(location);
	};

	const handleEndEditing = async () => {
		await fetchLocation(locale);
	};

	useEffect(() => {
		fetchLocation(``).catch(console.error);
	}, []);

	useEffect(() => {
		setCity(city);
		setLocale(city);
		dispatch(setLocation(city));
	}, [city]);

	useEffect(() => {
		setCity(location);
		setLocale(location);
		dispatch(setLocation(location));
	}, [location]);

	return (
		<View>
			<View style={styles.view}>
				<View style={styles.inputWrapper}>
					<TextInput
						autoCapitalize={`none`}
						autoCorrect={false}
						onChangeText={setLocation}
						onEndEditing={handleEndEditing}
						placeholder={locale ? locale : `Current Location`}
						placeholderTextColor="#999"
						style={styles.input}
						value={locale ?? location}
					/>
					<Pressable
						style={({ pressed }) => [
							styles.button,
							{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
						]}
						onPress={() => {
						}}
						android_ripple={{
							color: "grey",
							radius: 28,
							borderless: true,
						}}
					>
						<Entypo
							name="location-pin"
							style={styles.icon}
						/>
					</Pressable>
				</View>
			</View>
			{locationErrorMessage !== `` ? <Text>{`${locationErrorMessage}`}</Text> : null}
		</View>
	);
};

const styles = StyleSheet.create({
	view: {
		backgroundColor: AppStyles.color.background,
		flexDirection: `row`,
		paddingLeft: 8,
		paddingTop: 12,
		paddingBottom: 18,
	},
	button: {
		backgroundColor: AppStyles.color.primary,
		color: AppStyles.color.black,
		marginLeft: `auto`,
		shadowColor: AppStyles.input.shadow,
		...AppStyles.Button,
	},
	icon: {
		fontSize: 16,
	},
	input: {
		fontSize: 18,
	},
	inputWrapper: {
		backgroundColor: AppStyles.color.white,
		flexDirection: `row`,
		shadowColor: AppStyles.input.shadow,
		...AppStyles.TextInput,
	}
});

export default LocationInput;
