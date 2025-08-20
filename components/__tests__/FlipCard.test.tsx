import * as React from 'react';
import renderer from 'react-test-renderer';
import { Text, View } from 'react-native';

import FlipCard from '../shared/FlipCard';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const mockReact = require('react');
  const original = jest.requireActual('react-native-gesture-handler');
  return {
    ...original,
    TapGestureHandler: ({ children }: any) => children,
    PanGestureHandler: ({ children }: any) => children,
    State: {
      END: 4,
    },
  };
});

const mockFront = React.createElement(View, { testID: 'front' }, 
  React.createElement(Text, null, 'Front Content')
);

const mockBack = React.createElement(View, { testID: 'back' },
  React.createElement(Text, null, 'Back Content')
);

it('renders FlipCard correctly', () => {
  const tree = renderer.create(
    React.createElement(FlipCard, { front: mockFront, back: mockBack })
  ).toJSON();

  expect(tree).toMatchSnapshot();
});