import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { YelpBusiness } from '../../types/yelp';
import useBusinessHours from '../../hooks/useBusinessHours';
import { useBusinessDetails } from '../../hooks/useBusinessDetails';
import { formatTodayHours } from '../../utils/hours';
import AppStyles from '../../AppStyles';
import { BusinessProps } from '../../hooks/useResults';

interface BusinessDetailsProps {
  business: YelpBusiness;
  onYelp?: () => void;
  onClose?: () => void;
}

export function BusinessDetails({ business, onYelp, onClose }: BusinessDetailsProps) {
  // Convert YelpBusiness to BusinessProps for the hook
  const businessForHook: BusinessProps = {
    id: business.id,
    name: business.name,
    image_url: business.image_url || '',
    rating: business.rating || 0,
    price: business.price || '',
    location: {
      city: business.location?.city || '',
      display_address: business.location?.display_address || [],
      address1: business.location?.address1 || '',
    },
    categories: business.categories?.map(cat => ({ title: cat.title, alias: cat.alias })) || [],
    is_closed: business.is_closed || false,
    coordinates: business.coordinates,
    url: business.url || '',
    phone: business.phone || '',
    display_phone: business.display_phone || '',
    // Add placeholder fields required by BusinessProps
    alias: business.alias || '',
    distance: business.distance || 0,
    photos: business.photos || [],
    review_count: business.review_count || 0,
    transactions: business.transactions || [],
    hours: business.hours || [],
  };

  // Get enriched business details
  const { business: richBusiness, loading: detailsLoading } = useBusinessDetails(businessForHook);
  
  // Use legacy hook for fallback
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={styles.title} allowFontScaling numberOfLines={2} ellipsizeMode="tail" testID="bd-title">{business.name}</Text>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>Address</Text>
          <Text style={styles.address} allowFontScaling testID="bd-address">
            {business.location?.display_address?.join(', ') || 'Address not available'}
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>Contact</Text>
          <Text style={styles.phone} allowFontScaling testID="bd-phone">
            {business.display_phone || business.phone || 'Phone not available'}
          </Text>
        </View>

        {/* Weekly Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>Hours</Text>
          <View style={styles.hoursContainer} testID="bd-hours">
            {detailsLoading && !richBusiness.hours?.[0] ? (
              <View style={styles.hoursLoadingRow}>
                <ActivityIndicator size="small" color={AppStyles.color.roulette.gold} />
                <Text style={styles.noHours} allowFontScaling>Loading hours...</Text>
              </View>
            ) : richBusiness.hours?.[0]?.open?.length ? (
              richBusiness.hours[0].open.map((slot: any, index: number) => {
                const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const formatTime = (hhmm: string): string => {
                  const hour = parseInt(hhmm.slice(0, 2), 10);
                  const minute = hhmm.slice(2);
                  const date = new Date(2000, 0, 1, hour, parseInt(minute, 10));
                  return date.toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true
                  });
                };
                
                return (
                  <View key={index} style={styles.hoursRow}>
                    <Text style={styles.dayLabel} allowFontScaling>{dayNames[slot.day]}:</Text>
                    <Text style={styles.dayHours} allowFontScaling>
                      {formatTime(slot.start)} – {formatTime(slot.end)}
                    </Text>
                  </View>
                );
              })
            ) : weekly ? (
              weekly.split('\n').map((line, index) => {
                const [day, hours] = line.split(': ');
                return (
                  <View key={index} style={styles.hoursRow}>
                    <Text style={styles.dayLabel} allowFontScaling>{day}:</Text>
                    <Text style={styles.dayHours} allowFontScaling>{hours}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noHours} allowFontScaling>Hours not available</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {/* Map Button */}
          {business.location?.display_address && (
            <Pressable 
              style={styles.actionButton} 
              onPress={handleMapPress}
              testID="bd-map-btn"
            >
              <Text style={styles.actionButtonText} allowFontScaling>📍 Map</Text>
            </Pressable>
          )}

          {/* Call Button */}
          {(business.phone || business.display_phone) && (
            <Pressable 
              style={styles.actionButton} 
              onPress={handleCallPress}
              testID="bd-call-btn"
            >
              <Text style={styles.actionButtonText} allowFontScaling>📞 Call</Text>
            </Pressable>
          )}

          {/* Yelp Button */}
          {business.url && (
            <Pressable 
              style={styles.actionButton} 
              onPress={handleYelpPress}
              testID="bd-yelp-btn"
            >
              <Text style={styles.actionButtonText} allowFontScaling>🔗 Yelp</Text>
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
            <Text style={styles.closeButtonText} allowFontScaling>Close</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    alignSelf: 'stretch',
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    rowGap: 16,
  },
  title: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginBottom: 16,
    textAlign: 'left',
  },
  section: {
    marginBottom: 16,
    minWidth: 0,
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
    flexShrink: 1,
    minWidth: 0,
  },
  phone: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greydark,
    flexShrink: 1,
    minWidth: 0,
  },
  hoursContainer: {
    backgroundColor: AppStyles.color.background,
    borderRadius: 12,
    padding: 12,
    rowGap: 6,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  dayLabel: {
    width: 90,
    minWidth: 0,
    fontFamily: AppStyles.fonts.medium,
    fontSize: 14,
    color: AppStyles.color.greydark,
  },
  dayHours: {
    flex: 1,
    textAlign: 'right',
    minWidth: 0,
    fontSize: 14,
    color: AppStyles.color.greylight,
    fontFamily: AppStyles.fonts.regular,
  },
  noHours: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greylight,
    fontStyle: 'italic',
  },
  hoursLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppStyles.color.roulette.gold,
    minWidth: 0,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.white,
  },
  closeButton: {
    marginTop: 8,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppStyles.color.greylight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
  },
});