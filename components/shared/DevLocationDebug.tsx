import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LocationObjectCoords } from 'expo-location';
import AppStyles from '../../AppStyles';

interface DevLocationDebugProps {
  coords: LocationObjectCoords | null;
  city: string;
  isLoading: boolean;
}

const DevLocationDebug: React.FC<DevLocationDebugProps> = ({ coords, city, isLoading }) => {
  if (!__DEV__) return null;

  const normalizeCoords = (coords: LocationObjectCoords | null) => {
    if (!coords) return null;
    return {
      lat: Math.round(coords.latitude * 10000) / 10000,
      lng: Math.round(coords.longitude * 10000) / 10000,
    };
  };

  const normalized = normalizeCoords(coords);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 DEV Location Debug</Text>
      <Text style={styles.text}>
        📍 City: {city || 'Loading...'}
      </Text>
      <Text style={styles.text}>
        🌐 Coords: {normalized ? `${normalized.lat}, ${normalized.lng}` : 'None'}
      </Text>
      <Text style={styles.text}>
        ⏳ Loading: {isLoading ? 'Yes' : 'No'}
      </Text>
      <Text style={styles.text}>
        🔑 Cache Key: pizza:{normalized ? `${normalized.lat},${normalized.lng}` : city}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppStyles.color.roulette.gold + '20',
    borderColor: AppStyles.color.roulette.gold,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  title: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginBottom: 8,
  },
  text: {
    fontSize: 12,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greydark,
    lineHeight: 16,
  },
});

export default DevLocationDebug;