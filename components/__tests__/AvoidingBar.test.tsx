import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AvoidingBar } from '../AvoidingBar';

describe('AvoidingBar', () => {
  it('renders nothing when there is nothing to avoid', () => {
    const { queryByTestId } = render(
      <AvoidingBar dealbreakers={[]} perSearchExcludes={[]} blockedCount={0} onPress={jest.fn()} />
    );
    expect(queryByTestId('avoiding-bar')).toBeNull();
  });

  it('summarizes cuisines and blocked count, and fires onPress', () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(
      <AvoidingBar dealbreakers={['sushi']} perSearchExcludes={['pizza']} blockedCount={3} onPress={onPress} />
    );
    expect(getByText(/Sushi/)).toBeTruthy();
    expect(getByText(/Pizza/)).toBeTruthy();
    expect(getByText(/3 blocked/)).toBeTruthy();
    fireEvent.press(getByTestId('avoiding-bar'));
    expect(onPress).toHaveBeenCalled();
  });
});
