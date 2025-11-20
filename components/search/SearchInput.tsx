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
	setIsLoading?: Dispatch<SetStateAction<boolean>>;
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
	isLoading = false,
	setIsLoading
}: SearchBarProps) => {
	const [locationErrorMessage, city, canonicalLocation, coords, locationResults, searchLocation, resolveSearchArea, isLocationLoading, lastResolvedLocation] = useLocation();
	const [errorMessage, results, searchApi, searchApiWithResolver, internalIsLoading] = useResults();
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

	// Search with GPS coordinates if available, otherwise use location resolver
	const handleDoneEditing = async (term: string, locationQuery: string) => {
		// Prevent double submits when loading
		if (isLoading) return;

		try {
			// Signal loading start to parent
			setIsLoading?.(true);

			let resolvedLocation;

			// Prefer GPS coordinates if available
			if (coords?.latitude && coords?.longitude) {
				resolvedLocation = {
					coords: { latitude: coords.latitude, longitude: coords.longitude },
					label: canonicalLocation || city || 'Current Location',
					source: 'coords' as const,
					alternatives: lastResolvedLocation?.alternatives
				};
			} else {
				// Fallback: Use location resolver to get coordinates
				const locationToResolve = locationQuery || canonicalLocation || city || 'Current Location';
				resolvedLocation = await resolveSearchArea(locationToResolve);

				if (!resolvedLocation?.coords) {
					setErrorMessage('Unable to determine location. Please try again.');
					setIsLoading?.(false);
					return;
				}
			}

			// Call the API and get the businesses array
			const businesses = await searchApiWithResolver(term, resolvedLocation);

			// Create ResultsProps and pass to parent
			const resultsWithId: ResultsProps = {
				id: `search-${Date.now()}`,
				businesses: businesses || []
			};

			setResults(resultsWithId);

			// Signal loading complete to parent
			setIsLoading?.(false);
		} catch (error) {
			console.error('[SearchInput] Error in handleDoneEditing:', error);
			setErrorMessage('Search failed. Please try again.');
			setIsLoading?.(false);
		}
	};

	// REMOVED: This useEffect was causing re-geocoding on every location change
	// The search should only trigger when user explicitly submits or changes the search term
	// Location updates happen automatically through the location watcher

	// REMOVED: No longer passing results from useResults hook - we handle it directly in handleDoneEditing
	// useEffect(() => {
	// 	setResults(results);
	// }, [results.id]);

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
							color={AppStyles.color.roulette.accent} 
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
