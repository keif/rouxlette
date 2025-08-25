import React, { Platform } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { YelpBusiness } from '../../types/yelp';
import useBusinessHours from '../../hooks/useBusinessHours';
import AppStyles from '../../AppStyles';

interface BusinessDetailsProps {
  business: YelpBusiness;
  onYelp?: () => void;
  onClose?: () => void;
}

export function BusinessDetails({ business, onYelp, onClose }: BusinessDetailsProps) {
  const { weekly } = useBusinessHours(business.hours);

  const handleMapPress = () => {
    if (!business.location) return;
    
    const address = business.location.display_address?.join(', ') || '';
    const encodedAddress = encodeURIComponent(address);
    
    const mapUrl = Platform.select({
      ios: `maps:?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
      default: `https://maps.google.com/?q=${encodedAddress}`,
    });
    
    if (mapUrl) {
      Linking.openURL(mapUrl);
    }
  };

  const handleCallPress = () => {
    const phone = business.phone || business.display_phone;
    if (phone) {
      // Clean phone number for tel: URL
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      Linking.openURL(`tel:${cleanPhone}`);
    }
  };

  const handleYelpPress = () => {
    if (business.url) {
      Linking.openURL(business.url);
    } else if (onYelp) {
      onYelp();
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title} testID="bd-title">{business.name}</Text>

      {/* Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.address} testID="bd-address">
          {business.location?.display_address?.join(', ') || 'Address not available'}
        </Text>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.phone} testID="bd-phone">
          {business.display_phone || business.phone || 'Phone not available'}
        </Text>
      </View>

      {/* Weekly Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hours</Text>
        <View style={styles.hoursContainer} testID="bd-hours">
          {weekly ? (
            weekly.split('\n').map((line, index) => {
              const [day, hours] = line.split(': ');
              return (
                <View key={index} style={styles.hoursRow}>
                  <Text style={styles.dayLabel}>{day}:</Text>
                  <Text style={styles.dayHours}>{hours}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noHours}>Hours not available</Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          {/* Map Button */}
          {business.location?.display_address && (
            <Pressable 
              style={styles.actionButton} 
              onPress={handleMapPress}
              testID="bd-map-btn"
            >
              <Text style={styles.actionButtonText}>📍 Map</Text>
            </Pressable>
          )}

          {/* Call Button */}
          {(business.phone || business.display_phone) && (
            <Pressable 
              style={styles.actionButton} 
              onPress={handleCallPress}
              testID="bd-call-btn"
            >
              <Text style={styles.actionButtonText}>📞 Call</Text>
            </Pressable>
          )}

          {/* Yelp Button */}
          {business.url && (
            <Pressable 
              style={styles.actionButton} 
              onPress={handleYelpPress}
              testID="bd-yelp-btn"
            >
              <Text style={styles.actionButtonText}>🔗 Yelp</Text>
            </Pressable>
          )}
        </View>

        {/* Close Button */}
        {onClose && (
          <Pressable 
            style={styles.closeButton} 
            onPress={onClose}
            testID="bd-close-btn"
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greydark,
    lineHeight: 22,
  },
  phone: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greydark,
  },
  hoursContainer: {
    backgroundColor: AppStyles.color.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: AppStyles.color.greylight + '40',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
    width: 80,
  },
  dayHours: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greylight,
    flex: 1,
    textAlign: 'right',
  },
  noHours: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greylight,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppStyles.color.roulette.gold,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.white,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppStyles.color.greylight,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
  },
});