import React, { Dispatch, SetStateAction, useState } from "react";
import { StyleSheet } from "react-native";
import { Slider } from "@miblanchard/react-native-slider";
import AppStyles from "../AppStyles";

interface SliderViewProps {
	distance: number;
	setDistance: Dispatch<SetStateAction<number>>;
}

// const METER_TO_MILE = 0.0006213712;
const MINIMUM_RADIUS = 0.3;
const MAXIMUM_RADIUS = 25;

const SliderView: React.FC<SliderViewProps> = ({ distance, setDistance }: SliderViewProps) => {
	const [distValue, setDistValue] = useState<number>(distance);

	const handleOnSlidingComplete = (value: number) => {
		setDistValue(value[0]);
		setDistance(value[0] || MINIMUM_RADIUS);
	};

	return (
		<Slider
			animateTransitions
			animationType={"spring"}
			containerStyle={styles.sliderContainer}
			maximumTrackTintColor={AppStyles.color.greylight}
			maximumValue={MAXIMUM_RADIUS}
			minimumTrackTintColor={AppStyles.color.primary}
			minimumValue={0}
			onSlidingComplete={handleOnSlidingComplete}
			step={1}
			thumbStyle={styles.thumbStyle}
			thumbTintColor={AppStyles.color.primary}
			trackStyle={styles.track}
			value={distValue}
		/>
	);
};

const styles = StyleSheet.create({
	sliderContainer: {
		marginHorizontal: 16,
		marginBottom: 12,
	},
	thumbStyle: {
		borderRadius: 12,
		borderWidth: 2,
		borderColor: AppStyles.color.white,
		elevation: 8,
		height: 24,
		shadowColor: AppStyles.color.black,
		shadowOffset: {
			height: 0,
			width: 0,
		},
		shadowOpacity: 0.5,
		shadowRadius: 7.49,
		width: 24,
	},
	thumbText: {
		textAlign: "center",
		width: 170,
	},
	track: {
		height: 6,
	},
});

export default SliderView;
