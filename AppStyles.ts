import { StyleSheet } from "react-native";

const AppStyles = {
	Button: {
		fontSize: 30,
		paddingRight: 16,
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
	ButtonPressable: {
		borderRadius: 36,
		fontSize: 30,
		padding: 16,
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
	color: {
		background: `#F0EEEE`,
		black: `#000`,
		closed: `#a7171a`,
		greydark: `#333`,
		greylight: `#999`,
		open: `#71C562`,
		phone: `#71C562`,
		primary: `rgba(51,178,73,1)`,
		shadow: `#333`,
		white: `#fff`,
		yelp: `#c41200`,
		// Roulette theme colors
		roulette: {
			accent: `#475569`, // Deep slate - primary accent color
			red: `#DC2626`, // Vibrant red from logo
			green: `#059669`, // Green from logo
			teal: `#5F9EA0`, // Teal from logo wheel
			neutral: `#6B7280`,
			gold: `#D4AF37`, // Deprecated - use accent instead
		},
	},
	fonts: {
		bold: "WorkSans-Bold",
		medium: "WorkSans-Medium",
		regular: "WorkSans-Regular",
		semiBold: "WorkSans-SemiBold",
	},
	icon: {
		fontSize: 20,
		paddingHorizontal: 12,
	},
	input: {
		shadow: `#333`,
	},
	textShadow: {
		textShadowColor: `#000`,
		textShadowOffset: {
			width: 0,
			height: 0,
		},
		textShadowRadius: 6,
	},
	TextInput: {
		elevation: 8,
		flex: 1,
		fontSize: 18,
		height: 20,
	},
	TextInputWrapper: {
		elevation: 8,
		flex: 1,
		fontSize: 18,
		paddingVertical: 16,
	},
};

export default AppStyles;
