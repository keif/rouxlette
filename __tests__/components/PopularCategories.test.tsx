import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PopularCategories from '../../components/search/PopularCategories';

const mockCategories = [
  { title: 'Pizza', emoji: '🍕', term: 'pizza' },
  { title: 'Sushi', emoji: '🍣', term: 'sushi' },
];

describe('PopularCategories', () => {
  it('should call onSelect with correct term when category is tapped', () => {
    const mockOnSelect = jest.fn();
    
    const { getByTestId } = render(
      <PopularCategories
        categories={mockCategories}
        onSelect={mockOnSelect}
        disabled={false}
      />
    );

    fireEvent.press(getByTestId('category-pizza'));
    
    expect(mockOnSelect).toHaveBeenCalledWith('pizza');
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('should not call onSelect when disabled', () => {
    const mockOnSelect = jest.fn();
    
    const { getByTestId } = render(
      <PopularCategories
        categories={mockCategories}
        onSelect={mockOnSelect}
        disabled={true}
      />
    );

    fireEvent.press(getByTestId('category-pizza'));
    
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('should render all categories', () => {
    const { getByText } = render(
      <PopularCategories
        categories={mockCategories}
        onSelect={() => {}}
        disabled={false}
      />
    );

    expect(getByText('Pizza')).toBeTruthy();
    expect(getByText('Sushi')).toBeTruthy();
    expect(getByText('🍕')).toBeTruthy();
    expect(getByText('🍣')).toBeTruthy();
  });

  it('should have disabled styles when disabled prop is true', () => {
    const { getByTestId } = render(
      <PopularCategories
        categories={mockCategories}
        onSelect={() => {}}
        disabled={true}
      />
    );

    const categoryCard = getByTestId('category-pizza');
    expect(categoryCard.props.disabled).toBe(true);
  });
});