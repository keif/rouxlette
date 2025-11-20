/**
 * Rouxlette Color System
 * iOS-inspired minimal color palette
 */

export const colors = {
  // Primary
  primary: '#007AFF',       // iOS blue
  primaryDark: '#0051D5',
  primaryLight: '#4DA2FF',

  // Semantic
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',

  // Neutrals
  black: '#000000',
  white: '#FFFFFF',
  gray50: '#F9F9F9',
  gray100: '#F2F2F7',
  gray200: '#E5E5EA',
  gray300: '#D1D1D6',
  gray400: '#C7C7CC',
  gray500: '#AEAEB2',
  gray600: '#8E8E93',
  gray700: '#636366',
  gray800: '#48484A',
  gray900: '#1C1C1E',

  // Surfaces
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Borders & Dividers
  border: 'rgba(0, 0, 0, 0.08)',
  divider: 'rgba(0, 0, 0, 0.12)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.4)',
  scrim: 'rgba(0, 0, 0, 0.6)',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
} as const;

export type ColorKey = keyof typeof colors;
