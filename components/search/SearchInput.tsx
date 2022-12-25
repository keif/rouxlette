import { Feather } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";
import { View } from "../Themed";
import useResults, { ResultsProps } from "../../hooks/useResults";
import Config from "../../Config";
import AppStyles from "../../AppStyles";
import ErrorMessageView from "../shared/ErrorMessageView";

interface SearchBarProps {
	city: string;
	placeholder: string;
	setResults: Dispatch<SetStateAction<ResultsProps>>;
	setTerm: Dispatch<SetStateAction<string>>;
	term: string;
}

const SearchInput = ({ city, setTerm, placeholder, setResults, term }: SearchBarProps) => {
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
				<View style={{ ...styles.inputWrapper }}>
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
						selectionColor="#54D3C2"
						style={styles.input}
						value={term}
					/>
					{/* cross Icon, depending on whether the search bar is clicked or not */}
					{searchClicked ? (
						<Pressable
							style={({ pressed }) => [
								styles.buttonClear,
								{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
							]}
							onPress={(props) => handleDoneEditing(term, city)}
							android_ripple={{
								color: "grey",
								borderless: true,
							}}
						>
							<Feather
								name={`x`}
								size={20}
								color="black"
								onPress={() => {
									setTerm(``);
								}} />
						</Pressable>) : null}
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
	button: {
		backgroundColor: AppStyles.color.primary,
		color: AppStyles.color.black,
		marginLeft: `auto`,
		shadowColor: AppStyles.input.shadow,
		...AppStyles.ButtonPressable,
	},
	buttonClear: {
		color: AppStyles.color.black,
		marginLeft: `auto`,
		shadowColor: AppStyles.input.shadow,
		...AppStyles.Button,
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
