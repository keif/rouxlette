import React, { useContext } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Config from "../../Config";
import { RootContext } from "../../context/RootContext";
import { setShowFilter } from "../../context/reducer";
import AppStyles from "../../AppStyles";
import { Text } from "../Themed";
import PriceFilter from "./PriceFilter";
import PopularFilter from "./PopularFilter";
import DistanceFilter from "./DistanceFilter";

interface Props {
}

const FilterModal: React.FC<Props> = () => {
	const { state, dispatch } = useContext(RootContext);
	const showFilter = state.showFilter;
	const handleShowFilter = (filterState: boolean) => dispatch(setShowFilter(filterState));

	return (
		<Modal
			animationType="slide"
			onRequestClose={() => handleShowFilter(false)}
			transparent
			visible={showFilter}
		>
			<StatusBar backgroundColor={AppStyles.color.white} />
			<SafeAreaView style={{ flex: 1, backgroundColor: AppStyles.color.white }}>
				<View
					style={{ flexDirection: "row", alignItems: "center", padding: 8 }}
				>
					<View style={{ flex: 1, alignItems: "flex-start" }}>
						<Pressable
							style={({ pressed }) => [
								{ padding: 8, opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
							]}
							onPress={() => handleShowFilter(false)}
							android_ripple={{ color: "grey", radius: 20, borderless: true }}
						>
							<Icon name="close" size={25} color="black" />
						</Pressable>
					</View>
					<Text style={styles.headerText}>Filters</Text>
					<View style={{ flex: 1 }} />
				</View>
				<View style={styles.headerShadow} />

				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{ paddingVertical: 16 }}
				>
					<PriceFilter />

					<View style={styles.divider} />

					<PopularFilter />

					<View style={styles.divider} />

					<DistanceFilter />

					<View style={styles.divider} />

				</ScrollView>

				<View style={styles.divider} />

				<View style={styles.buttonContainer}>
					<Pressable
						style={({ pressed }) => [
							styles.button,
							{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
						]}
						android_ripple={{ color: "lightgrey" }}
						onPress={() => handleShowFilter(false)}
					>
						<Text style={styles.buttonText}>Apply</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		</Modal>
	);
};

const styles = StyleSheet.create({
	headerText: {
		fontFamily: AppStyles.fonts.bold,
		fontSize: 22,
		textAlign: "center",
		textAlignVertical: "center",
	},
	headerShadow: {
		backgroundColor: AppStyles.color.greydark,
		elevation: 4,
		height: Config.isAndroid ? 0.2 : 1,
	},
	divider: {
		backgroundColor: AppStyles.color.greydark,
		height: StyleSheet.hairlineWidth,
	},
	sectionTitleWrapper: {
		paddingHorizontal: 16,
	},
	sectionTitle: {
		color: AppStyles.color.black,
		fontFamily: AppStyles.fonts.regular,
		fontSize: 18,
		fontWeight: `800`,
	},
	switchText: {
		alignSelf: "center",
		flex: 1,
		fontFamily: AppStyles.fonts.regular,
	},
	buttonContainer: {
		borderRadius: 24,
		elevation: 8,
		margin: 16,
		marginTop: 8,
		overflow: "hidden",
		shadowColor: "grey",
		shadowOffset: { width: 4, height: 4 },
		shadowOpacity: 0.6,
		shadowRadius: 8,
	},
	button: {
		alignItems: "center",
		backgroundColor: AppStyles.color.primary,
		height: 48,
		justifyContent: "center",
	},
	buttonText: {
		color: "white",
		fontFamily: AppStyles.fonts.medium,
		fontSize: 18,
	},
});

export default FilterModal;
