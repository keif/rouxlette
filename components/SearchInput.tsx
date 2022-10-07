import { Feather } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useEffect } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";
import { Text, View } from "./Themed";
import useResults, { Result } from "../hooks/useResults";
import Config from "../Config";

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
		setResults(results);
	};

	useEffect(() => {
		handleDoneEditing(term, city);
	}, [city]);

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
					onPress={() => {
					}}
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
		backgroundColor: `#F0EEEE`,
		flexDirection: `row`,
		paddingLeft: 8,
		paddingTop: 12,
		paddingBottom: 10,
	},
	button: {
		alignSelf: `center`,
		backgroundColor: '#54D3C2',
		borderRadius: 36,
		color: `#fff`,
		fontSize: 30,
		marginRight: 12,
		padding: 16,
		shadowColor: '#333',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
	icon: {
		fontSize: 16,
	},
	input: {
		backgroundColor: '#fff',
		borderRadius: 32,
		elevation: 8,
		flex: 1,
		fontSize: 18,
		marginRight: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		shadowColor: '#333',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
});

export default SearchInput;
