import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, Linking } from 'react-native';
import { YelpBusiness } from '../../types/yelp';
import useBusinessHours from '../../hooks/useBusinessHours';
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
  const { todayLabel, isOpen } = useBusinessHours(business.hours);
  const { isFavorite, toggleFavorite } = useFavorites();
  // const { width: winW } = useWindowDimensions();
  // const insets = useSafeAreaInsets();
  
  // Match modal horizontal padding + safe-area so content never bleeds
  // const H_PADDING = 16 + insets.left + insets.right;

  // Calculate responsive card width
  // const cardWidth = Math.min(620, Math.max(320, Math.floor(winW - H_PADDING * 2)));

  // Convert YelpBusiness to BusinessProps for favorites
  const businessForFavorites: BusinessProps = {
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
  };

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
          onPress={() => toggleFavorite(businessForFavorites)}
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
        <Text style={styles.categories} numberOfLines={1} ellipsizeMode="tail" testID="bqi-categories">
          {(business.categories ?? []).map(c => c?.title).filter(Boolean).join(', ')}
        </Text>
      )}

      {/* Today's Hours */}
      <View style={styles.hoursRow}>
        <Text style={styles.hoursLabel} testID="bqi-today">
          Today: {todayLabel || 'Hours unavailable'}
        </Text>
        {typeof isOpen === 'boolean' && (
          <View style={[styles.statusTag, isOpen ? styles.openTag : styles.closedTag]}>
            <Text style={[styles.statusText, isOpen ? styles.openText : styles.closedText]} testID="bqi-status">
              {isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        )}
      </View>

      {/* Distance */}
      {business.distance && formatDistance(business.distance) && (
        <Text style={styles.distance} testID="bqi-distance">
          📍 {formatDistance(business.distance)}
        </Text>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {onDetails && (
          <Pressable 
            style={styles.button} 
            onPress={onDetails}
            testID="bqi-details-btn"
          >
            <Text style={styles.buttonText} allowFontScaling>Details</Text>
          </Pressable>
        )}
        
        {business.url && (
          <Pressable 
            style={styles.button} 
            onPress={handleYelpPress}
            testID="bqi-yelp-btn"
          >
            <Text style={styles.buttonText} allowFontScaling>Yelp</Text>
          </Pressable>
        )}
        
        {onClose && (
          <Pressable 
            style={[styles.button, styles.closeButton]} 
            onPress={onClose}
            testID="bqi-close-btn"
          >
            <Text style={[styles.buttonText, styles.closeButtonText]} allowFontScaling>Close</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppStyles.color.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: 'hidden',
    alignSelf: 'center',
    minWidth: 320,
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
    fontWeight: '700',
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
    alignContent: 'flex-start',
  },
  ratingPill: {
    backgroundColor: AppStyles.color.roulette.gold + '15',
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
    color: AppStyles.color.roulette.gold,
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
    marginBottom: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  hoursLabel: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
    flex: 1,
    marginRight: 8,
    minWidth: 0,
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
    paddingBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppStyles.color.roulette.gold,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    minWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.white,
  },
  closeButton: {
    backgroundColor: AppStyles.color.greylight,
  },
  closeButtonText: {
    color: AppStyles.color.greydark,
  },
});