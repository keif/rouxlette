import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { YelpBusiness } from '../../types/yelp';
import useBusinessHours from '../../hooks/useBusinessHours';
import { useBusinessDetails } from '../../hooks/useBusinessDetails';
import { getTodayHours } from '../../utils/hours';
import AppStyles from '../../AppStyles';
import { useFavorites } from '../../hooks/useFavorites';
import { Ionicons } from '@expo/vector-icons';
import { BusinessProps } from '../../hooks/useResults';

interface BusinessQuickInfoProps {
  business: YelpBusiness;
  onDetails?: () => void;
  onClose?: () => void;
}

export function BusinessQuickInfo({ business, onDetails, onClose }: BusinessQuickInfoProps) {
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
  const { todayLabel, isOpen } = useBusinessHours(business.hours);
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Get today's hours from rich business data
  const todayHoursText = getTodayHours(richBusiness.hours?.[0]);

  const handleYelpPress = () => {
    if (business.url) {
      Linking.openURL(business.url);
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    const miles = (distance * 0.000621371).toFixed(1);
    return `${miles} mi`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {/* Business Image */}
        <View style={styles.imageWrap}>
          {business.image_url ? (
            <Image 
              source={{ uri: business.image_url }} 
              style={styles.image}
              testID="bqi-image"
            />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
          
          {/* Favorite Button */}
          <Pressable
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(richBusiness)}
            testID="bqi-favorite-btn"
            accessibilityLabel={isFavorite(business.id) ? "Remove from favorites" : "Add to favorites"}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons
              name={isFavorite(business.id) ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite(business.id) ? AppStyles.color.yelp : AppStyles.color.white}
              style={styles.favoriteIcon}
            />
          </Pressable>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail" testID="bqi-title">{business.name}</Text>

        {/* Meta Information */}
        <View style={styles.metaRow}>
          {business.rating && (
            <View style={styles.ratingPill}>
              <Text style={styles.rating} testID="bqi-rating">
                {business.rating.toString()}★
              </Text>
            </View>
          )}
          {business.review_count && (
            <View style={styles.reviewsPill}>
              <Text style={styles.reviews} testID="bqi-reviews">
                {business.review_count.toString()} reviews
              </Text>
            </View>
          )}
          {business.price && (
            <View style={styles.pricePill}>
              <Text style={styles.price} testID="bqi-price">
                {business.price}
              </Text>
            </View>
          )}
        </View>

        {/* Categories */}
        {business.categories && business.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.categories} numberOfLines={2} ellipsizeMode="tail" testID="bqi-categories">
              {(business.categories ?? []).map(c => c?.title).filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        {/* Today's Hours */}
        <View style={styles.section}>
          <View style={styles.hoursRow}>
            {detailsLoading && !richBusiness.hours?.[0] ? (
              <View style={styles.hoursLoadingRow}>
                <ActivityIndicator size="small" color={AppStyles.color.roulette.accent} />
                <Text style={styles.hoursLabel} testID="bqi-today">
                  Loading hours...
                </Text>
              </View>
            ) : (
              <Text style={styles.hoursLabel} testID="bqi-today">
                {todayHoursText}
              </Text>
            )}
            
            {typeof isOpen === 'boolean' && (
              <View style={[styles.statusTag, isOpen ? styles.openTag : styles.closedTag]}>
                <Text style={[styles.statusText, isOpen ? styles.openText : styles.closedText]} testID="bqi-status">
                  {isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Distance */}
        {business.distance && formatDistance(business.distance) && (
          <View style={styles.section}>
            <Text style={styles.distance} testID="bqi-distance">
              📍 {formatDistance(business.distance)}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {onDetails && (
            <Pressable 
              style={styles.actionButton} 
              onPress={onDetails}
              testID="bqi-details-btn"
            >
              <Text style={styles.actionButtonText} allowFontScaling>Details</Text>
            </Pressable>
          )}
          
          {business.url && (
            <Pressable 
              style={styles.actionButton} 
              onPress={handleYelpPress}
              testID="bqi-yelp-btn"
            >
              <Text style={styles.actionButtonText} allowFontScaling>Yelp</Text>
            </Pressable>
          )}
        </View>

        {/* Close Button */}
        {onClose && (
          <Pressable 
            style={styles.closeButton} 
            onPress={onClose}
            testID="bqi-close-btn"
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
  imageWrap: {
    width: '100%',
    aspectRatio: 3/2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    backgroundColor: AppStyles.color.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greylight,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    textShadowColor: AppStyles.color.black,
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 4,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  ratingPill: {
    backgroundColor: AppStyles.color.roulette.accent + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewsPill: {
    backgroundColor: AppStyles.color.greylight + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pricePill: {
    backgroundColor: AppStyles.color.roulette.green + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.roulette.accent,
  },
  reviews: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greydark,
  },
  price: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.roulette.green,
  },
  categories: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: '#666',
    flexShrink: 1,
    minWidth: 0,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  hoursLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  hoursLabel: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
    flex: 1,
    marginRight: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openTag: {
    backgroundColor: AppStyles.color.roulette.green + '20',
  },
  closedTag: {
    backgroundColor: AppStyles.color.roulette.red + '20',
  },
  statusText: {
    fontSize: 12,
    fontFamily: AppStyles.fonts.bold,
  },
  openText: {
    color: AppStyles.color.roulette.green,
  },
  closedText: {
    color: AppStyles.color.roulette.red,
  },
  distance: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greylight,
    flexShrink: 1,
    minWidth: 0,
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
    backgroundColor: AppStyles.color.roulette.accent,
    minWidth: 0,
    maxWidth: 140,
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