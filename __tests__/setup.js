// Global test setup
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

// Mock expo-location to prevent native module errors
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 100 }
  })),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  Accuracy: { Balanced: 3 },
}));

// Mock expo-linking to prevent manifest errors
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'rouxlette://'),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  parse: jest.fn((url) => ({ path: url, queryParams: {} })),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock react-native-worklets (required by reanimated)
jest.mock('react-native-worklets', () => ({
  createWorklet: jest.fn(),
  runOnJS: jest.fn((fn) => fn),
  runOnUI: jest.fn((fn) => fn),
}));

// Mock react-native-reanimated fully to avoid native module issues
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, Image } = require('react-native');

  const createAnimatedComponent = (component) => component;

  return {
    __esModule: true,
    default: {
      View,
      Text,
      Image,
      ScrollView: View,
      FlatList: View,
      createAnimatedComponent,
      addWhitelistedNativeProps: jest.fn(),
      addWhitelistedUIProps: jest.fn(),
    },
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn) => ({ value: typeof fn === 'function' ? fn() : fn }),
    useAnimatedGestureHandler: () => ({}),
    useAnimatedScrollHandler: () => ({}),
    useAnimatedProps: () => ({}),
    useAnimatedRef: () => ({ current: null }),
    useAnimatedReaction: jest.fn(),
    withTiming: (value) => value,
    withSpring: (value) => value,
    withDecay: (value) => value,
    withDelay: (delay, animation) => animation,
    withSequence: (...animations) => animations[0],
    withRepeat: (animation) => animation,
    interpolate: () => 0,
    interpolateColor: () => 'transparent',
    Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    createAnimatedComponent,
    Easing: {
      linear: jest.fn((t) => t),
      ease: jest.fn((t) => t),
      bezier: jest.fn(() => jest.fn((t) => t)),
      in: jest.fn((t) => t),
      out: jest.fn((t) => t),
      inOut: jest.fn((t) => t),
    },
    Layout: { springify: jest.fn(() => ({})) },
    FadeIn: { duration: jest.fn(() => ({ build: jest.fn() })) },
    FadeOut: { duration: jest.fn(() => ({ build: jest.fn() })) },
    SlideInRight: { duration: jest.fn(() => ({})) },
    SlideOutLeft: { duration: jest.fn(() => ({})) },
    View,
    Text,
    Image,
    ScrollView: View,
    FlatList: View,
  };
});