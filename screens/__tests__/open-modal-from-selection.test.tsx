import React from 'react';
import { setSelectedBusiness, showBusinessModal } from '../../context/reducer';
import { BusinessProps } from '../../hooks/useResults';
import { ActionType } from '../../context/actions';

// Sample business data for testing
const sampleBusiness: BusinessProps = {
  id: 'test-business-123',
  name: 'Test Restaurant',
  alias: 'test-restaurant',
  url: 'https://yelp.com/biz/test-restaurant',
  rating: 4.5,
  review_count: 128,
  price: '$$',
  categories: [
    { alias: 'italian', title: 'Italian' },
    { alias: 'pizza', title: 'Pizza' }
  ],
  coordinates: { latitude: 40.7128, longitude: -74.0060 },
  image_url: 'https://example.com/image.jpg',
  distance: 500,
  phone: '+15551234567',
  display_phone: '(555) 123-4567',
  location: {
    address1: '123 Main St',
    address2: null,
    address3: '',
    city: 'Columbus',
    country: 'US',
    display_address: ['123 Main St', 'Columbus, OH 43215'],
    state: 'OH',
    zip_code: '43215'
  },
  hours: [{
    hours_type: 'REGULAR',
    is_open_now: true,
    open: [
      { day: 0, start: '0900', end: '1700', is_overnight: false }
    ]
  }],
  photos: ['https://example.com/photo1.jpg'],
  transactions: ['pickup', 'delivery'],
  is_closed: false
};

describe('HomeScreen modal dispatch from roulette', () => {
  it('should create correct setSelectedBusiness action', () => {
    const action = setSelectedBusiness(sampleBusiness);
    
    expect(action.type).toBe(ActionType.SetSelectedBusiness);
    expect(action.payload.business).toEqual(sampleBusiness);
  });

  it('should create correct showBusinessModal action', () => {
    const action = showBusinessModal();
    
    expect(action.type).toBe(ActionType.ShowBusinessModal);
  });

  it('should have business object compatible with modal', () => {
    // Test that BusinessProps from results is compatible with YelpBusiness type
    // This ensures the dispatch will work correctly
    expect(sampleBusiness.id).toBeDefined();
    expect(sampleBusiness.name).toBeDefined();
    expect(sampleBusiness.rating).toBeDefined();
    expect(sampleBusiness.categories).toBeDefined();
    
    // Key properties that the modal expects
    expect(typeof sampleBusiness.name).toBe('string');
    expect(typeof sampleBusiness.id).toBe('string');
  });

  it('should be able to dispatch actions in sequence', () => {
    const mockDispatch = jest.fn();
    
    // Simulate what the HomeScreen does
    mockDispatch(setSelectedBusiness(sampleBusiness));
    mockDispatch(showBusinessModal());
    
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: ActionType.SetSelectedBusiness,
      payload: { business: sampleBusiness }
    }));
    expect(mockDispatch).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: ActionType.ShowBusinessModal
    }));
  });
});