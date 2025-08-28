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
	const [locationErrorMessage, city, coords, locationResults, searchLocation, isLocationLoading] = useLocation();
	const [errorMessage, results, searchApi] = useResults();
	const [searchClicked, setSearchClick] = useState<boolean>(false);

	const handleDoneEditing = async (term: string, city: string) => {
		if (__DEV__) {
			logSafe('[SearchInput] handleDoneEditing', { term, city, hasCoords: !!coords });
		}
		await searchApi(term, city, coords);
	};

	useEffect(() => {
		handleDoneEditing(term, city);
	}, [city, coords]);

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
