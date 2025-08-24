import React, { useReducer } from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BusinessCardModal } from '../../components/shared/BusinessCardModal';
import { RootContext } from '../../context/RootContext';
import { appReducer } from '../../context/reducer';
import { initialAppState } from '../../context/state';

// Mock navigation to avoid pulling in heavy RN Navigation dependencies
jest.mock('../../navigation', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockNavigation() {
    return (
      <View testID="mock-navigation">
        <Text>Mock Navigation</Text>
      </View>
    );
  };
});

// Mock useBusinessHours to avoid Date complexity
jest.mock('../../hooks/useBusinessHours', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    todayLabel: '9:00 AM–5:00 PM',
    isOpen: true,
    weekly: 'Mock weekly hours'
  }))
}));

// Mock cached resources hook to avoid asset loading
jest.mock('../../hooks/useCachedResources', () => ({
  __esModule: true,
  default: jest.fn(() => true) // Always return loaded
}));

// Mock color scheme hook  
jest.mock('../../hooks/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'light')
}));

// Minimal test root that mirrors the App structure without navigation complexity
function TestRoot() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  return (
    <SafeAreaProvider>
      <RootContext.Provider value={{ state, dispatch }}>
        <BusinessCardModal />
      </RootContext.Provider>
    </SafeAreaProvider>
  );
}

describe('BusinessCardModal mounting smoke test', () => {
  it('should mount without crashing', () => {
    const { getByTestId } = render(<TestRoot />);
    
    // Should not crash during render
    expect(true).toBe(true);
  });

  it('should not be visible by default', () => {
    const { queryByTestId } = render(<TestRoot />);
    
    // Modal should not be visible by default (no selectedBusiness in initial state)
    expect(queryByTestId('modal-backdrop')).toBeNull();
    
    // Business info components should not be rendered
    expect(queryByTestId('bqi-title')).toBeNull();
    expect(queryByTestId('bd-title')).toBeNull();
  });

  it('should have access to context', () => {
    // This test ensures the modal has proper context access by not crashing
    // If context was missing, the useContext call would throw
    const { queryByTestId } = render(<TestRoot />);
    
    // Modal rendered without context errors
    expect(queryByTestId('modal-backdrop')).toBeNull();
  });

  it('should render null when no selectedBusiness in initial state', () => {
    const { queryByTestId, toJSON } = render(<TestRoot />);
    
    // The BusinessCardModal component should return null when no selectedBusiness
    // This means the component renders successfully but produces no visible output
    expect(queryByTestId('modal-backdrop')).toBeNull();
    
    // Component tree should be minimal (just the provider wrapper)
    const tree = toJSON();
    expect(tree).toBeDefined();
  });
});