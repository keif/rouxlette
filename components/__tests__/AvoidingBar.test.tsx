import React from 'react';
import { Text } from 'react-native';
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

  it('dedupes a cuisine present in both lists so it renders once', () => {
    const { getByTestId } = render(
      <AvoidingBar dealbreakers={['sushi']} perSearchExcludes={['sushi']} blockedCount={0} onPress={jest.fn()} />
    );
    const summary = getByTestId('avoiding-bar')
      .findAllByType(Text)
      .map(node => node.props.children)
      .find(child => typeof child === 'string' && child.includes('Sushi')) as string;
    expect(summary.match(/Sushi/g)?.length).toBe(1);
  });

  it('falls back to the raw alias for cuisines not in COMMON_CUISINES', () => {
    const { getByText } = render(
      <AvoidingBar dealbreakers={[]} perSearchExcludes={['klingon']} blockedCount={0} onPress={jest.fn()} />
    );
    expect(getByText(/klingon/)).toBeTruthy();
  });

  it('renders when only blockedCount is set (no cuisines)', () => {
    const { getByTestId, getByText } = render(
      <AvoidingBar dealbreakers={[]} perSearchExcludes={[]} blockedCount={2} onPress={jest.fn()} />
    );
    expect(getByTestId('avoiding-bar')).toBeTruthy();
    expect(getByText(/2 blocked/)).toBeTruthy();
  });
});
