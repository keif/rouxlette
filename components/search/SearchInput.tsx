import { Feather } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { View } from "../Themed";
import useResults, { ResultsProps } from "../../hooks/useResults";
import AppStyles from "../../AppStyles";
import ErrorMessageView from "../shared/ErrorMessageView";
import useLocation from "../../hooks/useLocation";
import ClearButton from "./ClearButton";

interface SearchBarProps {
	placeholder: string;
	setResults: Dispatch<SetStateAction<ResultsProps>>;
	setTerm: Dispatch<SetStateAction<string>>;
	term: string;
}

const SearchInput = ({ setTerm, placeholder, setResults, term }: SearchBarProps) => {
	const [locationErrorMessage, city, locationResults, searchLocation] = useLocation();
	const [errorMessage, results, searchApi] = useResults();
	const [searchClicked, setSearchClick] = useState<boolean>(false);

	const handleDoneEditing = async (term: string, city: string) => {
		await searchApi(term, city);
	};

	useEffect(() => {
		handleDoneEditing(term, city);
	}, [city]);

	useEffect(() => {
		setResults(results);
	}, [results.id]);

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
						onBlur={() => setSearchClick(false)}
						onChangeText={setTerm}
						onEndEditing={(props) => handleDoneEditing(term, city)}
						onFocus={() => setSearchClick(true)}
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
			{errorMessage !== `` ?
				<ErrorMessageView text={errorMessage} />
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
		paddingBottom: 10,
	},
	icon: {
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

export default SearchInput;
