import { Feather } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
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
}

const SearchInput = ({ onBlur, onFocus, placeholder, setErrorMessage, setResults, setTerm, term }: SearchBarProps) => {
	const [locationErrorMessage, city, canonicalLocation, coords, locationResults, searchLocation, resolveSearchArea, isLocationLoading] = useLocation();
	const [errorMessage, results, searchApi, searchApiWithResolver] = useResults();
	const [searchClicked, setSearchClick] = useState<boolean>(false);

	// Enhanced handleDoneEditing that resolves location ambiguity
	const handleDoneEditing = async (term: string, locationQuery: string) => {
		if (__DEV__) {
			logSafe('[SearchInput] Enhanced handleDoneEditing', { 
				term, 
				locationQuery, 
				hasCoords: !!coords 
			});
		}
		
		try {
			// Step 1: Resolve the search area using enhanced location resolver
			const resolvedLocation = await resolveSearchArea(locationQuery);
			
			if (!resolvedLocation) {
				logSafe('[SearchInput] Failed to resolve location, falling back to legacy search');
				await searchApi(term, locationQuery, coords);
				return;
			}
			
			if (__DEV__) {
				logSafe('[SearchInput] Resolved location:', {
					query: locationQuery,
					resolved: resolvedLocation.label,
					coords: resolvedLocation.coords,
					source: resolvedLocation.source
				});
			}
			
			// Step 2: Search using the resolved location
			await searchApiWithResolver(term, resolvedLocation);
			
		} catch (error: any) {
			logSafe('[SearchInput] Error in enhanced search flow', { 
				message: error?.message, 
				term,
				locationQuery 
			});
			
			// Fallback to legacy search on error
			await searchApi(term, locationQuery, coords);
		}
	};

	useEffect(() => {
		// Use canonical location when available, fallback to city
		const locationToUse = canonicalLocation || city;
		handleDoneEditing(term, locationToUse);
	}, [city, canonicalLocation, coords]);

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
						onChangeText={setTerm}
						onEndEditing={(props) => handleDoneEditing(term, city)}
						onFocus={() => {
							if (onFocus) onFocus();
							setSearchClick(true);
						}}
						placeholder={placeholder}
						placeholderTextColor="#999"
						style={styles.input}
						value={term}
					/>
					{searchClicked ? (
						<ClearButton
							onPress={() => {
								handleDoneEditing(term, city);
								setTerm(``);
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
});

export default SearchInput;
