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
      <View style={styles.imageContainer}>
        {business.image_url && (
          <Image 
            source={{ uri: business.image_url }} 
            style={styles.image}
            testID="bqi-image"
          />
        )}
        
        {/* Favorite Button */}
        <Pressable
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(businessForFavorites)}
          testID="bqi-favorite-btn"
          accessibilityLabel={isFavorite(business.id) ? "Remove from favorites" : "Add to favorites"}
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
      <Text style={styles.title} testID="bqi-title">{business.name}</Text>

      {/* Meta Information */}
      <View style={styles.metaRow}>
        {business.rating && (
          <Text style={styles.rating} testID="bqi-rating">
            {business.rating.toString()}★
          </Text>
        )}
        {business.review_count && (
          <Text style={styles.reviews} testID="bqi-reviews">
            {business.review_count.toString()} reviews
          </Text>
        )}
        {business.price && (
          <Text style={styles.price} testID="bqi-price">
            {business.price}
          </Text>
        )}
      </View>

      {/* Categories */}
      {business.categories && business.categories.length > 0 && (
        <Text style={styles.categories} testID="bqi-categories">
          {business.categories.map(c => c.title).join(', ')}
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
            <Text style={styles.buttonText}>Details</Text>
          </Pressable>
        )}
        
        {business.url && (
          <Pressable 
            style={styles.button} 
            onPress={handleYelpPress}
            testID="bqi-yelp-btn"
          >
            <Text style={styles.buttonText}>Yelp</Text>
          </Pressable>
        )}
        
        {onClose && (
          <Pressable 
            style={[styles.button, styles.closeButton]} 
            onPress={onClose}
            testID="bqi-close-btn"
          >
            <Text style={[styles.buttonText, styles.closeButtonText]}>Close</Text>
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
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
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
    fontSize: 24,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.roulette.gold,
    marginRight: 8,
  },
  reviews: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greydark,
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.roulette.green,
  },
  categories: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greylight,
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hoursLabel: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
    flex: 1,
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
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppStyles.color.roulette.gold,
    borderRadius: 8,
    alignItems: 'center',
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