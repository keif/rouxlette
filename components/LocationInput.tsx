import { Entypo } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import useLocation from "../hooks/useLocation";
import { Text } from "./Themed";
import { RootContext } from "../context/RootContext";
import { setLocation } from "../context/reducer";

interface LocationInputProps {
	setCity: Dispatch<SetStateAction<string>>;
}

const LocationInput = ({ setCity }: LocationInputProps) => {
	// const { dispatch }  = useContext(RootContext)
	const [locationErrorMessage, city, locationResults, searchLocation] = useLocation();
	const [locale, setLocale] = useState<string>(``);

	const handleEndEditing = async () => {
		const loc = await searchLocation(locale);
		console.group(`LocationInput:`)
		console.log(`handleEndEditing:`, loc);
		console.groupEnd()
		setCity(city);
		setLocale(city);
		// dispatch(setLocation(city));
	};

	useEffect(() => {
		const fetchLocation = async () => {
			await searchLocation(``);
			setCity(city);
			setLocale(city);
			// dispatch(setLocation(city));
		}

		fetchLocation();
	}, []);

	return (
		<View>
			<View style={styles.view}>
				<Entypo
					name="location-pin"
					style={styles.icon}
				/>
				<TextInput
					autoCapitalize={`none`}
					autoCorrect={false}
					onChangeText={setLocation}
					onEndEditing={handleEndEditing}
					placeholder={locale ? locale : `Current Location`}
					style={styles.input}
					value={locale}
				/>
			</View>
			{locationErrorMessage !== `` ? <Text>{`${locationErrorMessage}`}</Text> : null}
		</View>
	);
};

const styles = StyleSheet.create({
	view: {
		backgroundColor: `#F0EEEE`,
		borderRadius: 5,
		flexDirection: `row`,
		height: 50,
		marginBottom: 10,
		marginHorizontal: 15,
		marginTop: 10,
	},
	icon: {
		alignSelf: `center`,
		color: `#87ceeb`,
		fontSize: 30,
		marginHorizontal: 15,
	},
	input: {
		color: `#87ceeb`,
		flex: 1,
		fontSize: 18,
	},
});

export default LocationInput;
