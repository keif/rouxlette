import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

interface DetailsScreenProps {
  route: {
    params: {
      restaurantId: string;
    };
  };
  navigation: any;
}

// Dummy data
const RESTAURANT_DETAIL = {
  id: '1',
  name: 'The Daily Pint',
  imageUrl: 'https://via.placeholder.com/400x300',
  rating: 4.5,
  reviewCount: 234,
  price: '$$',
  distance: 0.3,
  categories: ['Gastropub', 'American', 'Beer Bar'],
  address: '247 King Ave, Columbus, OH 43201',
  phone: '(614) 539-0375',
  hours: 'Open until 11:00 PM',
  isOpen: true,
  yelpUrl: 'https://www.yelp.com',
};

export const DetailsScreen: React.FC<DetailsScreenProps> = ({ navigation }) => {
  const restaurant = RESTAURANT_DETAIL;

  const handleDirections = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${restaurant.address}`,
      android: `geo:0,0?q=${restaurant.address}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${restaurant.phone}`);
  };

  const handleViewOnYelp = () => {
    Linking.openURL(restaurant.yelpUrl);
  };

  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <Image
        source={{ uri: restaurant.imageUrl }}
        style={styles.heroImage}
        resizeMode="cover"
      />

      {/* Back Button */}
      <SafeAreaView edges={['top']} style={styles.headerOverlay}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </Pressable>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{restaurant.name}</Text>

          {/* Metadata */}
          <View style={styles.metadata}>
            {/* Rating */}
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={styles.ratingText}>{restaurant.rating}</Text>
              <Text style={styles.reviewCount}>
                ({restaurant.reviewCount} reviews)
              </Text>
            </View>

            <Text style={styles.divider}>•</Text>
            <Text style={styles.price}>{restaurant.price}</Text>
            <Text style={styles.divider}>•</Text>
            <Text style={styles.distance}>{restaurant.distance} mi</Text>
          </View>

          {/* Categories */}
          <Text style={styles.categories}>
            {restaurant.categories.join(' • ')}
          </Text>

          {/* Open Status */}
          <View style={[styles.statusBadge, restaurant.isOpen && styles.statusBadgeOpen]}>
            <View style={[styles.statusDot, restaurant.isOpen && styles.statusDotOpen]} />
            <Text style={[styles.statusText, restaurant.isOpen && styles.statusTextOpen]}>
              {restaurant.hours}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleDirections}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Ionicons name="navigate" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Directions</Text>
          </Pressable>

          <Pressable
            onPress={handleCall}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Ionicons name="call" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Call</Text>
          </Pressable>

          <Pressable
            onPress={handleViewOnYelp}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Ionicons name="open-outline" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Yelp</Text>
          </Pressable>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={colors.gray700} />
            <Text style={styles.sectionTitle}>Address</Text>
          </View>
          <Text style={styles.sectionContent}>{restaurant.address}</Text>
        </View>

        {/* Phone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={20} color={colors.gray700} />
            <Text style={styles.sectionTitle}>Phone</Text>
          </View>
          <Text style={styles.sectionContent}>{restaurant.phone}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.gray200,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    marginLeft: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    ...typography.title2,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.callout,
    color: colors.gray900,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    ...typography.callout,
    color: colors.gray600,
    marginLeft: 4,
  },
  divider: {
    ...typography.callout,
    color: colors.gray400,
    marginHorizontal: spacing.sm,
  },
  price: {
    ...typography.callout,
    color: colors.gray700,
    fontWeight: '600',
  },
  distance: {
    ...typography.callout,
    color: colors.gray600,
  },
  categories: {
    ...typography.callout,
    color: colors.gray600,
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  statusBadgeOpen: {
    backgroundColor: colors.success + '15',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray500,
    marginRight: spacing.sm,
  },
  statusDotOpen: {
    backgroundColor: colors.success,
  },
  statusText: {
    ...typography.callout,
    color: colors.gray700,
  },
  statusTextOpen: {
    color: colors.success,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    ...typography.callout,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.gray900,
  },
  sectionContent: {
    ...typography.body,
    color: colors.gray700,
  },
});
