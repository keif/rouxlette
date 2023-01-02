import { Entypo } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import useLocation from "../../hooks/useLocation";
import { RootContext } from "../../context/RootContext";
import { setLocation } from "../../context/reducer";
import AppStyles from "../../AppStyles";
import ClearButton from "./ClearButton";

interface LocationInputProps {
	onFocus?: () => void;
	setErrorMessage: Dispatch<SetStateAction<string>>;
}

const LocationInput = ({ onFocus, setErrorMessage }: LocationInputProps) => {
	const { state, dispatch } = useContext(RootContext);
	const [locationErrorMessage, city, locationResults, searchLocation] = useLocation();
	const [locale, setLocale] = useState<string>(``);
	const [searchClicked, setSearchClick] = useState<boolean>(false);

	const fetchLocation = async (location: string) => {
		await searchLocation(location);
	};

	const handleEndEditing = async (locale: string) => {
		await fetchLocation(locale);
	};

	useEffect(() => {
		fetchLocation(``).catch(console.error);
	}, []);

	useEffect(() => {
		setLocale(city);
		dispatch(setLocation(city));
	}, [city]);

	useEffect(() => {
		setErrorMessage(locationErrorMessage);
	}, [locationErrorMessage]);
	return (
		<View>
			<View
				style={{
					borderBottomColor: AppStyles.color.greylight,
					borderBottomWidth: 1,
					marginLeft: `auto`,
					marginRight: `auto`,
					width: `80%`,
				}}
			/>
			<View style={styles.view}>
				<View style={styles.inputWrapper}>
					<Entypo
						name="location-pin"
						style={styles.icon}
					/>
					<TextInput
						autoCapitalize={`none`}
						autoCorrect={false}
						onBlur={() => setSearchClick(false)}
						onChangeText={(text) => setLocale(text)}
						onEndEditing={() => handleEndEditing(locale)}
						onFocus={() => {
							if (onFocus) onFocus();
							setSearchClick(true);
						}}
						placeholder={`Current Location`}
						placeholderTextColor="#999"
						style={styles.input}
						value={locale}
					/>
					{searchClicked ? (
						<ClearButton
							onPress={() => {
								handleEndEditing(locale);
							}}
						/>
					) : null}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	view: {
		backgroundColor: AppStyles.color.background,
		borderBottomStartRadius: 20,
		borderBottomEndRadius: 20,
		flexDirection: `row`,
	},
	inputWrapper: {
		backgroundColor: AppStyles.color.white,
		flexDirection: `row`,
		...AppStyles.TextInputWrapper,
		borderBottomStartRadius: 20,
		borderBottomEndRadius: 20,
	},
	button: {
		backgroundColor: AppStyles.color.primary,
		color: AppStyles.color.black,
		marginLeft: `auto`,
		...AppStyles.ButtonPressable,
	},
	icon: {
		...AppStyles.icon,
		color: AppStyles.color.primary,
	},
	input: {
		...AppStyles.TextInput,
	},
});

export default LocationInput;
