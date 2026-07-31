import React from 'react';
import { render } from '@testing-library/react-native';
import { ProviderAttribution } from '../ProviderAttribution';

describe('ProviderAttribution', () => {
  it('shows OSM attribution when an osm business is present', () => {
    const { getByText } = render(
      <ProviderAttribution businesses={[{ id: 'osm:node/1' } as any, { id: 'y1' } as any]} />
    );
    expect(getByText(/OpenStreetMap/)).toBeTruthy();
  });
  it('renders nothing when no osm businesses are present', () => {
    const { queryByText } = render(
      <ProviderAttribution businesses={[{ id: 'y1' } as any]} />
    );
    expect(queryByText(/OpenStreetMap/)).toBeNull();
  });
  it('renders nothing for an empty list', () => {
    const { queryByText } = render(<ProviderAttribution businesses={[]} />);
    expect(queryByText(/OpenStreetMap/)).toBeNull();
  });
});
