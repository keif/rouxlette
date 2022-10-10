import { StyleSheet, Text } from "react-native";
import AppStyles from "../../AppStyles";

interface OpenSignProps {
	is_open_now: boolean;
}

const OpenSign = ({ is_open_now }: OpenSignProps) => {
	if (is_open_now) {
		return (
			<Text style={styles.open}>Open</Text>
		);
	}
	return (
		<Text style={styles.closed}>Closed</Text>
	);
};

const styles = StyleSheet.create({
	closed: {
		color: AppStyles.color.closed,
		fontSize: 18,
		fontWeight: `bold`,
		...AppStyles.textShadow,
		textShadowColor: `#fff`,
	},
	open: {
		color: AppStyles.color.open,
		fontSize: 18,
		fontWeight: `bold`,
		...AppStyles.textShadow,
	},
});
export default OpenSign;
