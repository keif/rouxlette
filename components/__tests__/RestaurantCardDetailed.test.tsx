import * as React from 'react';
import renderer from 'react-test-renderer';

import RestaurantCardDetailed from '../search/RestaurantCardDetailed';
import { BusinessProps } from '../../hooks/useResults';

// react-native-reanimated and react-native-worklets are mocked globally in
// __tests__/setup.js. react-native-gesture-handler is set up via
// 'react-native-gesture-handler/jestSetup' in the same file.
//
// We only override the gesture handlers here so that the card's children render
// directly in the snapshot instead of being wrapped by the (non-rendering)
// native handler components.
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

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('@expo/vector-icons', () => ({
  FontAwesome: 'FontAwesome',
  MaterialIcons: 'MaterialIcons',
}));

// Mock Config
jest.mock('../../Config', () => ({
  isAndroid: false,
}));

const mockBusiness: BusinessProps = {
  id: 'test-id',
  name: 'Test Restaurant',
  image_url: 'https://example.com/image.jpg',
  url: 'https://yelp.com/test-restaurant',
  phone: '+15551234567',
  display_phone: '(555) 123-4567',
  review_count: 150,
  categories: [
    { alias: 'italian', title: 'Italian' },
    { alias: 'pizza', title: 'Pizza' }
  ],
  rating: 4.5,
  coordinates: {
    latitude: 37.7749,
    longitude: -122.4194
  },
  transactions: [],
  price: '$$',
  location: {
    address1: '123 Main St',
    address2: '',
    address3: '',
    city: 'San Francisco',
    zip_code: '94102',
    country: 'US',
    state: 'CA',
    display_address: ['123 Main St', 'San Francisco, CA 94102']
  },
  hours: [{
    open: [],
    hours_type: 'REGULAR',
    is_open_now: true
  }],
  is_closed: false,
  photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
};

it('renders RestaurantCardDetailed correctly', () => {
  const tree = renderer.create(
    React.createElement(RestaurantCardDetailed, { index: 0, result: mockBusiness })
  ).toJSON();

  expect(tree).toMatchSnapshot();
});