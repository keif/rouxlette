import { Entypo } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useContext, useEffect, useState, useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { LocationObjectCoords } from "expo-location";
import useLocation from "../../hooks/useLocation";
import { RootContext } from "../../context/RootContext";
import { setLocation, setCoords } from "../../context/reducer";
import AppStyles from "../../AppStyles";
import ClearButton from "./ClearButton";
import { logSafe } from "../../utils/log";
import LocationDisambiguation from "./LocationDisambiguation";

interface LocationInputProps {
	onFocus?: () => void;
	setErrorMessage: Dispatch<SetStateAction<string>>;
}

const LocationInput = ({ onFocus, setErrorMessage }: LocationInputProps) => {
	const { state, dispatch } = useContext(RootContext);
	const [locationErrorMessage, city, canonicalLocation, coords, locationResults, searchLocation, resolveSearchArea, isLocationLoading, lastResolvedLocation, stopLocationWatcher] = useLocation();
	const [locale, setLocale] = useState<string>(``);
	const [searchClicked, setSearchClick] = useState<boolean>(false);
	const [isManualLocation, setIsManualLocation] = useState<boolean>(false);
	const inputRef = useRef<TextInput>(null);

	const fetchLocation = async (location: string) => {
		await searchLocation(location);
	};

	const handleEndEditing = async (locale: string) => {
		const trimmedLocale = locale.trim();

		// If user enters a city name, stop GPS watching and geocode it
		if (trimmedLocale) {
			logSafe('LocationInput: User entered manual location', { locale: trimmedLocale });
			setIsManualLocation(true);
			stopLocationWatcher(); // Stop GPS tracking

			// Geocode the city name to get coordinates
			const resolved = await resolveSearchArea(trimmedLocale);
			if (resolved?.coords) {
				logSafe('LocationInput: Successfully resolved manual location', { label: resolved.label, coords: resolved.coords });
				// Update global state with the resolved coordinates
				dispatch(setLocation(resolved.label));
				dispatch(setCoords(resolved.coords as LocationObjectCoords));
			} else {
				logSafe('LocationInput: Failed to resolve manual location', { locale: trimmedLocale });
			}
		} else {
			// Empty string means user wants current location
			logSafe('LocationInput: User cleared location, reverting to GPS', {});
			setIsManualLocation(false);
			await fetchLocation(''); // This will start GPS watcher again
		}
	};

	const handleSelectAlternative = async (label: string, coords: { latitude: number; longitude: number }) => {
		logSafe('LocationInput: Alternative selected', { label, coords });
		setIsManualLocation(true);
		stopLocationWatcher(); // Stop GPS tracking

		// Update the input field
		setLocale(label);

		// Update global state with the selected coordinates
		dispatch(setLocation(label));
		dispatch(setCoords(coords as LocationObjectCoords));
	};

	useEffect(() => {
		fetchLocation(``).catch((error: any) => logSafe('LocationInput fetchLocation error', { message: error?.message }));
	}, []);

	useEffect(() => {
		// Only auto-update location display if not manually set
		if (!isManualLocation) {
			// Prefer canonical location over city for display
			const displayLocation = canonicalLocation || city;
			setLocale(displayLocation);
			dispatch(setLocation(displayLocation));

			if (__DEV__ && canonicalLocation && canonicalLocation !== city) {
				logSafe('[LocationInput] Using canonical location', {
					city,
					canonical: canonicalLocation,
					display: displayLocation
				});
			}
		}
	}, [city, canonicalLocation, isManualLocation]);

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
						ref={inputRef}
						editable={true}
						autoCapitalize={`none`}
						autoCorrect={false}
						selectTextOnFocus
						onBlur={() => setSearchClick(false)}
						onChangeText={(text) => setLocale(text)}
						onEndEditing={() => handleEndEditing(locale)}
						onFocus={() => {
							logSafe('LocationInput: Field focused', {});
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
								logSafe('LocationInput: Clear button pressed', {});
								setLocale(''); // Clear the input field
								handleEndEditing(''); // Pass empty string to trigger reset
							}}
						/>
					) : null}
				</View>
				<LocationDisambiguation
					resolvedLocation={lastResolvedLocation}
					onSelectAlternative={handleSelectAlternative}
				/>
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
		height: 50, // Override AppStyles default of 20 to make tappable
		paddingHorizontal: 8,
	},
});

export default LocationInput;
