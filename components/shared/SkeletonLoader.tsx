import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import AppStyles from '../../AppStyles';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton loader with shimmer animation
 * Used for loading states across the app
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = AppStyles.radius.s,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();

    return () => shimmer.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width as number, width as number],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

/**
 * Restaurant Card Skeleton
 * Matches the restaurant card layout
 */
export const RestaurantCardSkeleton: React.FC = () => (
  <View style={styles.cardContainer}>
    <SkeletonLoader width={80} height={80} borderRadius={AppStyles.radius.m} style={styles.cardImage} />
    <View style={styles.cardContent}>
      <SkeletonLoader width="80%" height={18} style={styles.cardTitle} />
      <SkeletonLoader width="60%" height={14} style={styles.cardSubtitle} />
      <SkeletonLoader width="40%" height={14} />
    </View>
  </View>
);

/**
 * List of Restaurant Card Skeletons
 * Shows 3 skeleton cards
 */
export const RestaurantListSkeleton: React.FC = () => (
  <View style={styles.listContainer}>
    <RestaurantCardSkeleton />
    <RestaurantCardSkeleton />
    <RestaurantCardSkeleton />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: AppStyles.color.gray100,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: AppStyles.color.white,
    borderRadius: AppStyles.radius.m,
    padding: AppStyles.spacing.m,
    marginBottom: AppStyles.spacing.s,
    ...AppStyles.shadow.level1,
  },
  cardImage: {
    marginRight: AppStyles.spacing.m,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    marginBottom: AppStyles.spacing.xs,
  },
  cardSubtitle: {
    marginBottom: AppStyles.spacing.xs,
  },
  listContainer: {
    padding: AppStyles.spacing.m,
  },
});

export default SkeletonLoader;
