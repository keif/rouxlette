import { StyleSheet, Text } from "react-native";
import AppStyles from "../../AppStyles";

interface OpenSignProps {
	is_open_now: boolean | null | undefined; // null/undefined means hours unknown
}

const OpenSign = ({ is_open_now }: OpenSignProps) => {
	// If is_open_now is null or undefined, show "Hours Unknown"
	if (is_open_now === null || is_open_now === undefined) {
		return (
			<Text style={styles.unknown}>Hours Unknown</Text>
		);
	}

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
	unknown: {
		color: AppStyles.color.greylight,
		fontSize: 18,
		fontWeight: `bold`,
		...AppStyles.textShadow,
		textShadowColor: `#fff`,
	},
});
export default OpenSign;
