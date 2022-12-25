import { Entypo } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import useLocation from "../../hooks/useLocation";
import { RootContext } from "../../context/RootContext";
import { setLocation } from "../../context/reducer";
import AppStyles from "../../AppStyles";
import ErrorMessageView from "../shared/ErrorMessageView";
import ClearButton from "./ClearButton";

interface LocationInputProps {
}

const LocationInput = ({}: LocationInputProps) => {
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

	return (
		<View>
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
						onFocus={() => setSearchClick(true)}
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
			{locationErrorMessage !== `` ?
				<ErrorMessageView text={locationErrorMessage} />
				: null}
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
		...AppStyles.ButtonPressable,
	},
	icon: {
		color: AppStyles.color.primary,
		fontSize: 16,
		paddingRight: 12,
	},
	input: {
		...AppStyles.TextInput,
	},
	inputWrapper: {
		backgroundColor: AppStyles.color.white,
		flexDirection: `row`,
		shadowColor: AppStyles.input.shadow,
		...AppStyles.TextInputWrapper,
	},
});

export default LocationInput;
