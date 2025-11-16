import { Feather } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { View } from "../Themed";
import useResults, { ResultsProps } from "../../hooks/useResults";
import AppStyles from "../../AppStyles";
import useLocation from "../../hooks/useLocation";
import ClearButton from "./ClearButton";
import { logSafe } from "../../utils/log";

interface SearchBarProps {
	onBlur?: () => void;
	onFocus?: () => void;
	placeholder: string;
	setErrorMessage: Dispatch<SetStateAction<string>>;
	setResults: Dispatch<SetStateAction<ResultsProps>>;
	setTerm: Dispatch<SetStateAction<string>>;
	term: string;
	externalQuery?: string;
	isLoading?: boolean;
}

const SearchInput = ({ 
	onBlur, 
	onFocus, 
	placeholder, 
	setErrorMessage, 
	setResults, 
	setTerm, 
	term, 
	externalQuery, 
	isLoading = false 
}: SearchBarProps) => {
	const [locationErrorMessage, city, canonicalLocation, coords, locationResults, searchLocation, resolveSearchArea, isLocationLoading, lastResolvedLocation] = useLocation();
	const [errorMessage, results, searchApi, searchApiWithResolver] = useResults();
	const [searchClicked, setSearchClick] = useState<boolean>(false);
	const [internalTerm, setInternalTerm] = useState(term);

	// Sync internal term with external query
	useEffect(() => {
		if (typeof externalQuery === 'string') {
			setInternalTerm(externalQuery);
		}
	}, [externalQuery]);

	// Sync internal term with prop
	useEffect(() => {
		setInternalTerm(term);
	}, [term]);

	// Simplified search that ONLY uses GPS coordinates (no geocoding)
	const handleDoneEditing = async (term: string, locationQuery: string) => {
		// Prevent double submits when loading
		if (isLoading) return;

		if (__DEV__) {
			logSafe('[SearchInput] handleDoneEditing', {
				term,
				locationLabel: canonicalLocation || city,
				hasCoords: !!coords,
				coords: coords ? { lat: coords.latitude, lon: coords.longitude } : null
			});
		}

		// ALWAYS use GPS coordinates for restaurant searches
		// This prevents ambiguous location geocoding (Powell, OH vs Powell, TN)
		if (!coords?.latitude || !coords?.longitude) {
			if (__DEV__) {
				logSafe('[SearchInput] ERROR: No GPS coordinates available yet');
			}
			setErrorMessage('Getting your location...');
			return;
		}

		// Use GPS coordinates directly - NO geocoding
		const resolvedLocation = {
			coords: { latitude: coords.latitude, longitude: coords.longitude },
			label: canonicalLocation || city || 'Current Location',
			source: 'coords' as const,
			alternatives: lastResolvedLocation?.alternatives
		};

		if (__DEV__) {
			logSafe('[SearchInput] Searching with GPS coords:', {
				term,
				location: resolvedLocation.label,
				coords: resolvedLocation.coords
			});
		}

		await searchApiWithResolver(term, resolvedLocation);
	};

	// REMOVED: This useEffect was causing re-geocoding on every location change
	// The search should only trigger when user explicitly submits or changes the search term
	// Location updates happen automatically through the location watcher

	useEffect(() => {
		setResults(results);
	}, [results.id]);

	useEffect(() => {
		setErrorMessage(errorMessage);
	}, [errorMessage]);

	return (
		<View>
			<View style={styles.view}>
				<View style={styles.inputWrapper}>
					<Feather
						name={`search`}
						style={styles.icon}
					/>
					<TextInput
						autoCapitalize={`none`}
						autoCorrect={false}
						onBlur={() => {
							if (onBlur) onBlur();
							setSearchClick(false);
						}}
						onChangeText={(text) => {
							setInternalTerm(text);
							setTerm(text);
						}}
						onEndEditing={() => handleDoneEditing(internalTerm, canonicalLocation || city)}
						onSubmitEditing={() => handleDoneEditing(internalTerm, canonicalLocation || city)}
						onFocus={() => {
							if (onFocus) onFocus();
							setSearchClick(true);
						}}
						placeholder={placeholder}
						placeholderTextColor="#999"
						style={styles.input}
						value={internalTerm}
					/>
					{isLoading ? (
						<ActivityIndicator 
							testID="qa-search-spinner"
							size="small" 
							color={AppStyles.color.roulette.gold} 
							style={styles.spinner}
						/>
					) : searchClicked ? (
						<ClearButton
							onPress={() => {
								handleDoneEditing(internalTerm, city);
								setTerm(``);
								setInternalTerm(``);
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
		borderTopStartRadius: 30,
		borderTopEndRadius: 30,
		flexDirection: `row`,
	},
	icon: {
		...AppStyles.icon,
	},
	input: {
		...AppStyles.TextInput,
	},
	inputWrapper: {
		backgroundColor: AppStyles.color.white,
		flexDirection: `row`,
		...AppStyles.TextInputWrapper,
	},
	spinner: {
		marginRight: 12,
		alignSelf: 'center',
	},
});

export default SearchInput;
