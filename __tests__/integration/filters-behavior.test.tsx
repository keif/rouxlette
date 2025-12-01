import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../../App';

// Simple integration test to verify the app renders without crashing
// and that our new filter components are integrated properly

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@miblanchard/react-native-slider', () => ({
  Slider: 'Slider'
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock Location services
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 39.9612, longitude: -82.9988 }
  })),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
}));

// Mock the Yelp API
jest.mock('../../api/yelp', () => ({
  get: jest.fn(() => Promise.resolve({ data: { businesses: [] } })),
}));

// Mock useCachedResources to immediately return loaded state
jest.mock('../../hooks/useCachedResources', () => ({
  __esModule: true,
  default: () => true,
}));

describe('Filters Behavior Integration', () => {
  it('renders app without crashing with new filter components', () => {
    // This test passes if no errors are thrown during rendering
    // The app requires many native modules, so we just verify it doesn't crash
    const { toJSON } = render(<App />);
    expect(toJSON()).toBeTruthy();
  });

  it('does not throw errors when filter components are rendered', () => {
    // This test passes if no errors are thrown during rendering
    expect(() => render(<App />)).not.toThrow();
  });
});