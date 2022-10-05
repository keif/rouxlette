import { Feather } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useEffect } from "react";
import { StyleSheet, TextInput } from "react-native";
import { Text, View } from "./Themed";
import useResults, { Result } from "../hooks/useResults";

interface SearchBarProps {
	icon: any;
	city: string;
	location: string;
	onTermChange: Dispatch<SetStateAction<string>>;
	placeholder: string;
	setResults: Dispatch<SetStateAction<Array<Result>>>;
	term: string;
}

const SearchInput = ({ icon, city, location, onTermChange, placeholder, setResults, term }: SearchBarProps) => {
	console.group(`SearchInput`);
	console.log(`city: ${city}`);
	console.log(`${placeholder}: ${term}`);
	console.groupEnd();
	const [errorMessage, results, searchApi] = useResults();

	const handleDoneEditing = async (term: string, city: string) => {
		console.group(`SearchInput: handleDoneEditing`);
		console.log(`term: ${term}, city: ${city}`);
		console.groupEnd();
		await searchApi(term, city);
		setResults(results);
	};

	useEffect(() => {
		handleDoneEditing(term, city);
	}, [city]);

	return (
		<View>
			<View style={styles.view}>
				<Feather
					name={icon}
					style={styles.icon}
				/>
				<TextInput
					autoCapitalize={`none`}
					autoCorrect={false}
					onChangeText={term => onTermChange(term)}
					onEndEditing={(props) => handleDoneEditing(term, city)}
					placeholder={placeholder}
					style={styles.input}
					value={term}
				/>
			</View>
			{errorMessage !== `` ? <Text>{`${errorMessage}`}</Text> : null}
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
		fontSize: 30,
		marginHorizontal: 15,
	},
	input: {
		flex: 1,
		fontSize: 18,
	},
});

export default SearchInput;
