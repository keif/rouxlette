import { Feather } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useEffect } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";
import { Text, View } from "./Themed";
import useResults, { Result } from "../hooks/useResults";
import Config from "../Config";
import AppStyles from "../AppStyles";

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
	const [errorMessage, results, searchApi] = useResults();

	const handleDoneEditing = async (term: string, city: string) => {
		await searchApi(term, city);
	};

	useEffect(() => {
		handleDoneEditing(term, city);
	}, [city]);

	useEffect(() => {
		setResults(results);
	}, [results])

	return (
		<View>
			<View style={styles.view}>
				<TextInput
					autoCapitalize={`none`}
					autoCorrect={false}
					onChangeText={term => onTermChange(term)}
					onEndEditing={(props) => handleDoneEditing(term, city)}
					placeholder={placeholder}
					placeholderTextColor="#999"
					selectionColor="#54D3C2"
					style={styles.input}
					value={term}
				/>
				<Pressable
					style={({ pressed }) => [
						styles.button,
						{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
					]}
					onPress={(props) => handleDoneEditing(term, city)}
					android_ripple={{
						color: "grey",
						radius: 28,
						borderless: true,
					}}
				>
					<Feather
						name={icon}
						style={styles.icon}
					/>
				</Pressable>
			</View>
			{errorMessage !== `` ? <Text>{`${errorMessage}`}</Text> : null}
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
		shadowColor: AppStyles.input.shadow,
		...AppStyles.Button
	},
	icon: {
		fontSize: 16,
	},
	input: {
		backgroundColor: AppStyles.color.white,
		shadowColor: AppStyles.input.shadow,
		...AppStyles.TextInput
	},
});

export default SearchInput;
