import React from 'react';
import { View, Text } from 'react-native';
import { YelpBusiness } from '../../types/yelp';
import useBusinessHours from '../../hooks/useBusinessHours';

interface BusinessQuickInfoProps {
  business: YelpBusiness;
}

export function BusinessQuickInfo({ business }: BusinessQuickInfoProps) {
  const { todayLabel } = useBusinessHours(business.hours);

  return (
    <View>
      <Text testID="bqi-title">{business.name}</Text>
      <Text>{business.rating ?? '—'}★ • {business.review_count ?? 0} reviews • {business.price ?? '—'}</Text>
      <Text>{business.categories?.map(c => c.title).join(', ') || '—'}</Text>
      <Text testID="bqi-today">Today: {todayLabel}</Text>
    </View>
  );
}