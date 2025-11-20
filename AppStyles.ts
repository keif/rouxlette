import { StyleSheet, Platform } from "react-native";

/**
 * Rouxlette Design System
 * Minimalist iOS-inspired design with SF Symbols, clean typography, and subtle depth
 */

const AppStyles = {
	/**
	 * Color System
	 */
	color: {
		// Primary Palette
		primary: "#007AFF", // iOS system blue - main CTA color
		primaryDark: "#0051D5", // Active/pressed states
		accentRed: "#FF3B30", // Destructive actions, exclusion chips
		success: "#34C759", // Open now, confirmations
		warning: "#FF9500", // Alerts, important info

		// Neutral Palette
		black: "#000000",
		gray900: "#1C1C1E", // Headings
		gray700: "#3A3A3C", // Body text
		gray500: "#8E8E93", // Secondary text
		gray300: "#C7C7CC", // Disabled text, dividers
		gray100: "#E5E5EA", // Backgrounds, cards
		gray50: "#F2F2F7", // Screen background
		white: "#FFFFFF",

		// Semantic Colors
		background: "#F2F2F7",
		surface: "#FFFFFF",
		border: "rgba(0, 0, 0, 0.04)",
		overlay: "rgba(0, 0, 0, 0.4)",
		shadow: "rgba(0, 0, 0, 0.12)",

		// Legacy aliases (for gradual migration)
		greydark: "#3A3A3C",
		greylight: "#8E8E93",
		open: "#34C759",
		closed: "#FF3B30",
		phone: "#007AFF",
		yelp: "#c41200",

		// Deprecated roulette colors (remove after migration)
		roulette: {
			accent: "#007AFF", // Now uses primary
			red: "#FF3B30",
			green: "#34C759",
			teal: "#5F9EA0", // Deprecated
			neutral: "#8E8E93",
			gold: "#D4AF37", // Deprecated
		},
	},

	/**
	 * Typography System (SF Pro - system default)
	 * Using iOS native font scaling
	 */
	typography: {
		largeTitle: {
			fontSize: 34,
			lineHeight: 41,
			fontWeight: "600" as const,
			letterSpacing: 0.37,
		},
		title1: {
			fontSize: 28,
			lineHeight: 34,
			fontWeight: "700" as const,
			letterSpacing: 0.36,
		},
		title2: {
			fontSize: 22,
			lineHeight: 28,
			fontWeight: "700" as const,
			letterSpacing: 0.35,
		},
		title3: {
			fontSize: 20,
			lineHeight: 25,
			fontWeight: "600" as const,
			letterSpacing: 0.38,
		},
		headline: {
			fontSize: 17,
			lineHeight: 22,
			fontWeight: "600" as const,
			letterSpacing: -0.41,
		},
		body: {
			fontSize: 17,
			lineHeight: 22,
			fontWeight: "400" as const,
			letterSpacing: -0.41,
		},
		callout: {
			fontSize: 16,
			lineHeight: 21,
			fontWeight: "400" as const,
			letterSpacing: -0.32,
		},
		subhead: {
			fontSize: 15,
			lineHeight: 20,
			fontWeight: "400" as const,
			letterSpacing: -0.24,
		},
		footnote: {
			fontSize: 13,
			lineHeight: 18,
			fontWeight: "400" as const,
			letterSpacing: -0.08,
		},
		caption1: {
			fontSize: 12,
			lineHeight: 16,
			fontWeight: "400" as const,
			letterSpacing: 0,
		},
		caption2: {
			fontSize: 11,
			lineHeight: 13,
			fontWeight: "500" as const,
			letterSpacing: 0.07,
		},
	},

	/**
	 * Spacing System (8pt grid)
	 */
	spacing: {
		xs: 4,
		s: 8,
		m: 16,
		l: 24,
		xl: 32,
		xxl: 48,
		xxxl: 64,
	},

	/**
	 * Corner Radius System
	 */
	radius: {
		xs: 4,
		s: 8,
		m: 12,
		l: 16,
		xl: 24,
		full: 9999, // Use for circular elements
	},

	/**
	 * Shadow/Elevation System (iOS-style subtle depth)
	 */
	shadow: {
		level1: {
			// Cards
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 1 },
			shadowRadius: 3,
			shadowOpacity: 0.12,
			elevation: 2,
		},
		level2: {
			// Floating buttons
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowRadius: 6,
			shadowOpacity: 0.15,
			elevation: 4,
		},
		level3: {
			// Modals
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 4 },
			shadowRadius: 12,
			shadowOpacity: 0.2,
			elevation: 8,
		},
		level4: {
			// Overlays
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 8 },
			shadowRadius: 24,
			shadowOpacity: 0.25,
			elevation: 12,
		},
	},

	/**
	 * Button Styles
	 */
	button: {
		primary: {
			height: 50,
			paddingHorizontal: 24,
			borderRadius: 12,
			backgroundColor: "#007AFF",
			...Platform.select({
				ios: {
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowRadius: 6,
					shadowOpacity: 0.15,
				},
				android: {
					elevation: 4,
				},
			}),
		},
		secondary: {
			height: 44,
			paddingHorizontal: 20,
			borderRadius: 10,
			backgroundColor: "#E5E5EA",
			...Platform.select({
				ios: {
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowRadius: 3,
					shadowOpacity: 0.12,
				},
				android: {
					elevation: 2,
				},
			}),
		},
		tertiary: {
			height: 36,
			paddingHorizontal: 16,
			borderRadius: 8,
		},
		icon: {
			width: 44,
			height: 44,
			borderRadius: 22,
			...Platform.select({
				ios: {
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowRadius: 3,
					shadowOpacity: 0.12,
				},
				android: {
					elevation: 2,
				},
			}),
		},
	},

	/**
	 * Input Styles
	 */
	input: {
		default: {
			height: 44,
			paddingHorizontal: 12,
			borderRadius: 10,
			borderWidth: 1,
			borderColor: "#C7C7CC",
			fontSize: 17,
			backgroundColor: "#FFFFFF",
		},
		focused: {
			borderWidth: 2,
			borderColor: "#007AFF",
		},
	},

	/**
	 * Card Styles
	 */
	card: {
		default: {
			backgroundColor: "#FFFFFF",
			borderRadius: 12,
			padding: 16,
			...Platform.select({
				ios: {
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowRadius: 3,
					shadowOpacity: 0.12,
				},
				android: {
					elevation: 2,
				},
			}),
		},
		elevated: {
			backgroundColor: "#FFFFFF",
			borderRadius: 16,
			padding: 20,
			...Platform.select({
				ios: {
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 4 },
					shadowRadius: 12,
					shadowOpacity: 0.2,
				},
				android: {
					elevation: 8,
				},
			}),
		},
	},

	/**
	 * Chip Styles
	 */
	chip: {
		default: {
			height: 32,
			paddingHorizontal: 12,
			borderRadius: 8,
			flexDirection: "row" as const,
			alignItems: "center" as const,
			justifyContent: "center" as const,
		},
		inclusion: {
			backgroundColor: "#007AFF",
		},
		exclusion: {
			backgroundColor: "#FF3B30",
		},
		inactive: {
			backgroundColor: "#E5E5EA",
			borderWidth: 1,
			borderColor: "#C7C7CC",
		},
	},

	/**
	 * Legacy font names (deprecated - will be removed)
	 * Using system fonts now (SF Pro on iOS, Roboto on Android)
	 */
	fonts: {
		bold: Platform.select({ ios: "System", android: "Roboto-Bold" }),
		medium: Platform.select({ ios: "System", android: "Roboto-Medium" }),
		regular: Platform.select({ ios: "System", android: "Roboto-Regular" }),
		semiBold: Platform.select({ ios: "System", android: "Roboto-Medium" }),
	},

	/**
	 * SF Symbol Sizes
	 */
	icon: {
		xs: 16,
		s: 20,
		m: 24,
		l: 28,
		xl: 48,
		xxl: 64,
	},

	/**
	 * Deprecated styles (remove after migration)
	 */
	Button: {
		fontSize: 30,
		paddingRight: 16,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
	ButtonPressable: {
		borderRadius: 36,
		fontSize: 30,
		padding: 16,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
	textShadow: {
		textShadowColor: "#000",
		textShadowOffset: { width: 0, height: 0 },
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
