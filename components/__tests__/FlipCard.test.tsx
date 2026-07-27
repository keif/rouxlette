import * as React from 'react';
import renderer from 'react-test-renderer';
import { Text, View } from 'react-native';

import FlipCard from '../shared/FlipCard';

// react-native-reanimated and react-native-worklets are mocked globally in
// __tests__/setup.js. react-native-gesture-handler is set up via
// 'react-native-gesture-handler/jestSetup' in the same file.
//
// We only override the gesture handlers here so that FlipCard's front/back
// children render directly in the snapshot instead of being wrapped by the
// (non-rendering) native handler components.
jest.mock('react-native-gesture-handler', () => {
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