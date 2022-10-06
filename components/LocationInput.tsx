import { Entypo, Feather } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import useLocation from "../hooks/useLocation";
import { Text } from "./Themed";
import { RootContext } from "../context/RootContext";
import { setLocation } from "../context/reducer";
import Config from "../Config";

interface LocationInputProps {
	setCity: Dispatch<SetStateAction<string>>;
}

const LocationInput = ({ setCity }: LocationInputProps) => {
	const { dispatch }  = useContext(RootContext)
	const [locationErrorMessage, city, locationResults, searchLocation] = useLocation();
	const [locale, setLocale] = useState<string>(``);

	const handleEndEditing = async () => {
		const loc = await searchLocation(locale);
		console.log(`LocationInput:`)
		console.log(`LocationInput: handleEndEditing:`, loc);
		setCity(city);
		setLocale(city);
		dispatch(setLocation(city));
	};

	useEffect(() => {
		console.log(`useEffect: fetchLocation PRE: city: ${city}`);
		const fetchLocation = async () => {
			console.log(`useEffect: fetchLocation CALL: city: ${city}`);
			const loc = await searchLocation(``);
			console.log(`useEffect: fetchLocation AWAIT: loc: ${loc}`);
			setCity(city);
			setLocale(city);
			dispatch(setLocation(city));
		}

		fetchLocation().catch(console.error);
	}, []);

	useEffect(() => {
		console.log(`useEffect: city: ${city}`);
		setCity(city);
		setLocale(city);
		dispatch(setLocation(city));
	}, [city])

	return (
		<View>
			<View style={styles.view}>
				<TextInput
					autoCapitalize={`none`}
					autoCorrect={false}
					onChangeText={setLocation}
					onEndEditing={handleEndEditing}
					placeholder={locale ? locale : `Current Location`}
					placeholderTextColor="#999"
					style={styles.input}
					value={locale}
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
			{locationErrorMessage !== `` ? <Text>{`${locationErrorMessage}`}</Text> : null}
		</View>
	);
};

const styles = StyleSheet.create({
	view: {
		backgroundColor: `#F0EEEE`,
		flexDirection: `row`,
		paddingLeft: 8,
		paddingTop: 12,
		paddingBottom: 10,
	},
	button: {
		alignSelf: `center`,
		backgroundColor: '#54D3C2',
		borderRadius: 36,
		color: `#fff`,
		fontSize: 30,
		marginRight: 12,
		padding: 16,
		shadowColor: '#333',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
	icon: {
		fontSize: 16,
	},
	input: {
		backgroundColor: '#fff',
		borderRadius: 32,
		elevation: 8,
		flex: 1,
		fontSize: 18,
		marginRight: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		shadowColor: '#333',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
});

export default LocationInput;
