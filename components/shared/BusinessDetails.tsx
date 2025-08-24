import React from 'react';
import { View, Text } from 'react-native';
import { YelpBusiness } from '../../types/yelp';

interface BusinessDetailsProps {
  business: YelpBusiness;
}

export function BusinessDetails({ business }: BusinessDetailsProps) {
  return (
    <View>
      <Text testID="bd-title">{business.name}</Text>
      <Text>{business.location?.display_address?.join(', ') || '—'}</Text>
      <Text>{business.display_phone || business.phone || '—'}</Text>
    </View>
  );
}