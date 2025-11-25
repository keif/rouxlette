import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, Linking, Platform, Alert } from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { FavoriteItem } from '../../types/favorites';
import AppStyles from '../../AppStyles';
import StarRating from './StarRating';
import Config from '../../Config';
import { logSafe } from '../../utils/log';
import { useFavorites } from '../../hooks/useFavorites';
import { useBlocked } from '../../hooks/useBlocked';
import { setSelectedBusiness, showBusinessModal } from '../../context/reducer';
import { useContext } from 'react';
import { RootContext } from '../../context/RootContext';

interface FavoriteCardProps {
  favorite: FavoriteItem;
  onPress?: (favorite: FavoriteItem) => void;
  isBlocked?: boolean;
}

export const FavoriteCard: React.FC<FavoriteCardProps> = ({ favorite, onPress, isBlocked = false }) => {
  const { removeFavorite } = useFavorites();
  const { removeBlocked } = useBlocked();
  const { dispatch } = useContext(RootContext);

  const handleRemoveItem = () => {
    const itemType = isBlocked ? 'Blocked Restaurant' : 'Favorite';
    const actionText = isBlocked ? 'Unblock' : 'Remove';

    Alert.alert(
      `${actionText} ${itemType}`,
      `${actionText} "${favorite.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: actionText,
          style: 'destructive',
          onPress: () => isBlocked ? removeBlocked(favorite.id) : removeFavorite(favorite.id),
        },
      ]
    );
  };

  const handleCardPress = () => {
    if (onPress) {
      onPress(favorite);
    } else {
      // Convert FavoriteItem to YelpBusiness format for the modal
      const business = {
        id: favorite.id,
        name: favorite.name,
        image_url: favorite.imageUrl || '',
        rating: favorite.rating || 0,
        price: favorite.price || '',
        location: {
          city: favorite.location?.city || '',
          display_address: [favorite.location?.address1 || ''].filter(Boolean),
        },
        categories: favorite.categories.map(cat => ({ title: cat, alias: cat })),
        is_closed: favorite.isClosed || false,
        url: `https://www.yelp.com/biz/${favorite.id}`,
        phone: '',
        display_phone: '',
        coordinates: {
          latitude: favorite.location?.latitude,
          longitude: favorite.location?.longitude,
        },
      };

      dispatch(setSelectedBusiness(business));
      dispatch(showBusinessModal());
    }
  };

  const handleMapsPress = () => {
    if (favorite.location?.address1) {
      const address = favorite.location.address1;
      const encodedAddress = encodeURIComponent(address);
      
      if (Platform.OS === 'ios') {
        Linking.openURL(`http://maps.apple.com/?q=${encodedAddress}`);
      } else {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
      }
    } else {
      Alert.alert('Address Not Available', 'No address information available for this restaurant.');
    }
  };

  const handleYelpPress = () => {
    const url = `https://www.yelp.com/biz/${favorite.id}`;
    Linking
      .openURL(url)
      .catch((err: any) => logSafe('FavoriteCard Yelp link error', { message: err?.message, url }));
  };

  const formatAddedDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Added today';
    } else if (diffDays <= 7) {
      return `Added ${diffDays} days ago`;
    } else {
      return `Added ${date.toLocaleDateString()}`;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { opacity: !Config.isAndroid && pressed ? 0.8 : 1 },
      ]}
      onPress={handleCardPress}
      android_ripple={{
        color: AppStyles.color.background,
        radius: 200,
      }}
      testID="favorite-card"
    >
      <View style={styles.content}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {favorite.imageUrl ? (
            <Image
              source={{ uri: favorite.imageUrl }}
              style={styles.image}
              resizeMode="cover"
              testID="favorite-image"
            />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <MaterialIcons name="restaurant" size={32} color={AppStyles.color.greylight} />
            </View>
          )}
          
          {/* Favorite heart or block icon */}
          <Pressable
            style={styles.heartContainer}
            onPress={handleRemoveItem}
            android_ripple={{
              color: 'rgba(255,255,255,0.3)',
              radius: 20,
              borderless: true,
            }}
            testID={isBlocked ? "unblock-button" : "favorite-heart"}
          >
            {isBlocked ? (
              <MaterialIcons
                name="block"
                size={20}
                color={AppStyles.color.error}
              />
            ) : (
              <Ionicons
                name="heart"
                size={20}
                color={AppStyles.color.yelp}
              />
            )}
          </Pressable>

          {/* Closed indicator */}
          {favorite.isClosed && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>CLOSED</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.details}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={2}>{favorite.name}</Text>
            {favorite.price && (
              <Text style={styles.price}>{favorite.price}</Text>
            )}
          </View>

          <View style={styles.meta}>
            <Text style={styles.categories} numberOfLines={1}>
              {favorite.categories.join(', ') || 'Restaurant'}
            </Text>
            {favorite.location?.city && (
              <Text style={styles.location}>• {favorite.location.city}</Text>
            )}
          </View>

          {favorite.rating && (
            <View style={styles.rating} testID="star-rating">
              <StarRating rating={favorite.rating} />
            </View>
          )}

          <Text style={styles.addedDate}>{formatAddedDate(favorite.addedAt)}</Text>

          {/* Quick actions */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
              ]}
              onPress={handleMapsPress}
              android_ripple={{
                color: AppStyles.color.background,
                radius: 20,
                borderless: true,
              }}
              testID="maps-button"
            >
              <MaterialIcons name="map" size={16} color={AppStyles.color.primary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
              ]}
              onPress={handleYelpPress}
              android_ripple={{
                color: AppStyles.color.background,
                radius: 20,
                borderless: true,
              }}
              testID="yelp-button"
            >
              <FontAwesome name="yelp" size={16} color={AppStyles.color.yelp} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppStyles.color.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: AppStyles.color.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  noImage: {
    backgroundColor: AppStyles.color.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: AppStyles.color.error,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closedText: {
    color: AppStyles.color.white,
    fontSize: 8,
    fontFamily: AppStyles.fonts.bold,
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.semiBold,
    color: AppStyles.color.black,
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.semiBold,
    color: AppStyles.color.greydark,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categories: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greylight,
    flex: 1,
  },
  location: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greylight,
  },
  rating: {
    marginBottom: 6,
  },
  addedDate: {
    fontSize: 12,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greylight,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    backgroundColor: AppStyles.color.background,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavoriteCard;