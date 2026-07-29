import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

const Boom = ({ crash }: { crash: boolean }) => {
  if (crash) throw new Error('kaboom');
  return <Text>child ok</Text>;
};

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    const { getByText, queryByTestId } = render(
      <ErrorBoundary>
        <Text>hello</Text>
      </ErrorBoundary>
    );
    expect(getByText('hello')).toBeTruthy();
    expect(queryByTestId('error-boundary')).toBeNull();
  });

  it('shows a visible fallback with the error message instead of crashing', () => {
    // React logs the caught error to console.error; silence it for a clean run.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { getByTestId, getByText } = render(
      <ErrorBoundary>
        <Boom crash />
      </ErrorBoundary>
    );
    expect(getByTestId('error-boundary')).toBeTruthy();
    expect(getByText('kaboom')).toBeTruthy();
    expect(getByText('Try again')).toBeTruthy();
    spy.mockRestore();
  });
});
