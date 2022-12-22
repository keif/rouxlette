import { StyleSheet, View } from "react-native";
import { Text } from "../Themed";
import SliderView from "../SliderView";
import React, { useState } from "react";
import AppStyles from "../../AppStyles";

const DistanceFilter = () => {
	const [distance, setDistance] = useState<number>(12);

	return (
		<>
			<View style={styles.sectionTitleWrapper}>
				<Text
					style={[styles.sectionTitle, { paddingTop: 16, paddingBottom: 24 }]}
				>
					Distance from my location: <Text style={styles.sectionSubTitle}>~{distance} miles</Text>
				</Text>
			</View>
			<SliderView distance={distance} setDistance={setDistance}/>
		</>
	);
};

const styles = StyleSheet.create({
	sectionTitleWrapper: {
		paddingHorizontal: 16,
	},
	sectionTitle: {
		color: AppStyles.color.black,
		fontFamily: AppStyles.fonts.bold,
		fontSize: 18,
		fontWeight: `400`,
		paddingVertical: 12,
	},
	sectionSubTitle: {
		fontFamily: AppStyles.fonts.regular,
	}
});

export default DistanceFilter;
