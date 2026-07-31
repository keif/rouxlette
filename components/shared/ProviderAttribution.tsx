import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { BusinessProps } from '../../hooks/useResults';
import { supperClub } from '../../theme/supperClub';

/**
 * ODbL compliance: whenever any displayed business originates from OpenStreetMap
 * (its `id` is prefixed `osm:`), we must surface "© OpenStreetMap contributors".
 * For all-Yelp result sets this renders nothing, preserving the existing look.
 */
export const ProviderAttribution: React.FC<{ businesses: BusinessProps[] }> = ({ businesses }) => {
  const hasOsm = businesses.some(b => typeof b.id === 'string' && b.id.startsWith('osm:'));
  if (!hasOsm) return null;
  return <Text style={styles.text}>Data © OpenStreetMap contributors</Text>;
};

const styles = StyleSheet.create({
  text: { fontSize: 11, color: supperClub.textMuted, textAlign: 'center', paddingVertical: 8 },
});

export default ProviderAttribution;
