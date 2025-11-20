/**
 * Typography System (SF Pro)
 * Using iOS system font defaults
 */

import { TextStyle } from 'react-native';

export const typography = {
  // Display
  display: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,

  // Titles
  title1: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '600',
    letterSpacing: 0.37,
  } as TextStyle,

  title2: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: 0.36,
  } as TextStyle,

  title3: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0.35,
  } as TextStyle,

  // Headlines
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.41,
  } as TextStyle,

  // Body
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.41,
  } as TextStyle,

  bodyEmphasis: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.41,
  } as TextStyle,

  // Callout
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.32,
  } as TextStyle,

  // Subheadline
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.24,
  } as TextStyle,

  // Footnote
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  } as TextStyle,

  // Captions
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  } as TextStyle,

  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500',
    letterSpacing: 0.06,
  } as TextStyle,
} as const;

export type TypographyKey = keyof typeof typography;
