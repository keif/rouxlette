/**
 * Rouxlette — "Supper Club" direction (warm neon)
 *
 * Design tokens for the Home + RouletteWheel direction approved via design-shotgun
 * (fuses the neon-arcade wheel drama with warm-bistro craft). ADDITIVE and
 * non-breaking: nothing here overrides the existing light `colors`/`typography`
 * system. Import these where you want the Supper Club look (start with HomeScreen),
 * or promote them to the global theme later.
 *
 * Rendering deps this direction assumes (install when you build it):
 *   - expo-linear-gradient   → the gradient Spin button + wheel fills
 *       npx expo install expo-linear-gradient
 *   - react-native-svg       → the segmented wheel face (RN has no conic-gradient;
 *       draw pie wedges with <Svg><Path>). npx expo install react-native-svg
 *   - expo-haptics           → already installed; keep the spin haptic.
 */

import { TextStyle, ViewStyle } from 'react-native';

/** Core palette — the five values everything derives from. */
export const supperClubPalette = {
  espresso: '#1A1013',   // ground (warm near-black, red-brown bias for contrast + warmth)
  aubergine: '#2A1420',  // radial glow at top of the screen / elevated tint
  magenta: '#FF3D81',    // hot primary accent
  gold: '#FFC24B',       // warm highlight — pointer, micro-labels
  terracotta: '#D3663F', // warm tertiary — chip borders, result thumb
  berry: '#5E2740',      // deep wheel segment
  cream: '#F3E9DC',      // primary text on dark
  creamDim: '#B9A894',   // secondary / muted text
} as const;

/** Semantic roles, mapped to the existing `colors` naming conventions. */
export const supperClub = {
  // Accents
  primary: supperClubPalette.magenta,
  gold: supperClubPalette.gold,
  terracotta: supperClubPalette.terracotta,
  berry: supperClubPalette.berry,

  // Grounds & surfaces (dark, warm)
  background: supperClubPalette.espresso,
  backgroundGlow: supperClubPalette.aubergine,      // top of the radial gradient
  surface: 'rgba(255, 255, 255, 0.04)',             // search bar / result card fill
  surfaceElevated: 'rgba(255, 255, 255, 0.06)',

  // Text
  textPrimary: '#FFFFFF',
  text: supperClubPalette.cream,
  textMuted: supperClubPalette.creamDim,
  textAccent: supperClubPalette.gold,

  // Borders & dividers (warm hairlines)
  border: 'rgba(255, 194, 75, 0.40)',
  borderSoft: 'rgba(255, 194, 75, 0.28)',
  chipBorder: 'rgba(211, 102, 63, 0.55)',

  // Semantic (kept, tuned for the dark warm ground)
  success: '#34C759',
  warning: supperClubPalette.gold,
  error: '#FF453A',

  // Overlays
  overlay: 'rgba(10, 6, 8, 0.55)',
  scrim: 'rgba(10, 6, 8, 0.72)',
} as const;

/**
 * Ordered wheel segment colors (8 wedges). Feed these to react-native-svg
 * <Path> wedges. The CSS conic-gradient in the mockup is exactly this sequence.
 */
export const supperClubWheelSegments = [
  supperClubPalette.magenta,
  supperClubPalette.gold,
  supperClubPalette.terracotta,
  supperClubPalette.berry,
  supperClubPalette.magenta,
  supperClubPalette.gold,
  supperClubPalette.terracotta,
  supperClubPalette.berry,
] as const;

/** Gradient stop arrays for expo-linear-gradient `colors={...}`. */
export const supperClubGradients = {
  spinButton: [supperClubPalette.magenta, supperClubPalette.gold] as const, // start={{x:0,y:0}} end={{x:1,y:0}}
  resultThumb: [supperClubPalette.terracotta, supperClubPalette.magenta] as const,
};

/**
 * Glow presets. Text glow uses RN textShadow*; element glow uses iOS shadow*
 * (colored glows are iOS-only — on Android use `elevation` for a neutral shadow).
 */
export const supperClubGlow = {
  wordmarkText: {
    textShadowColor: 'rgba(255, 61, 129, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  } as TextStyle,
  wheel: {
    shadowColor: supperClubPalette.magenta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 12,
  } as ViewStyle,
  spinButton: {
    shadowColor: supperClubPalette.magenta,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  } as ViewStyle,
} as const;

/**
 * Typography additions for this direction — the serif wordmark and gold
 * micro-labels. Body/UI text keeps the existing system-font `typography` scale.
 * `Georgia` ships on both iOS and Android, so no custom font load is needed.
 */
export const supperClubType = {
  /** App wordmark — pair with supperClubGlow.wordmarkText. */
  brand: {
    fontFamily: 'Georgia',
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: '#FFFFFF',
  } as TextStyle,
  /** Uppercase gold eyebrows / taglines ("CAN'T DECIDE · SPIN"). */
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: supperClubPalette.gold,
  } as TextStyle,
  /** Result restaurant name (serif, matches the wordmark family). */
  resultName: {
    fontFamily: 'Georgia',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  } as TextStyle,
} as const;

export type SupperClubColorKey = keyof typeof supperClub;
