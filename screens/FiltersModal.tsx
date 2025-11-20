import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const PRICE_LEVELS = ['$', '$$', '$$$', '$$$$'];
const DISTANCES = [
  { label: '0.5 mi', value: 0.5 },
  { label: '1 mi', value: 1 },
  { label: '2 mi', value: 2 },
  { label: '5 mi', value: 5 },
];

export const FiltersModal: React.FC<FiltersModalProps> = ({
  visible,
  onClose,
  onApply,
}) => {
  const [selectedPrices, setSelectedPrices] = useState<string[]>(['$$']);
  const [selectedDistance, setSelectedDistance] = useState(2);
  const [openNow, setOpenNow] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const togglePrice = (price: string) => {
    setSelectedPrices((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price]
    );
  };

  const handleApply = () => {
    onApply({
      prices: selectedPrices,
      distance: selectedDistance,
      openNow,
      minRating,
    });
    onClose();
  };

  const handleClearAll = () => {
    setSelectedPrices([]);
    setSelectedDistance(5);
    setOpenNow(false);
    setMinRating(0);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClearAll} hitSlop={8}>
            <Text style={styles.clearButton}>Clear All</Text>
          </Pressable>

          <Text style={styles.title}>Filters</Text>

          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={28} color={colors.gray700} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Price */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price</Text>
            <View style={styles.priceGrid}>
              {PRICE_LEVELS.map((price) => (
                <Pressable
                  key={price}
                  onPress={() => togglePrice(price)}
                  style={[
                    styles.priceButton,
                    selectedPrices.includes(price) && styles.priceButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.priceButtonText,
                      selectedPrices.includes(price) &&
                        styles.priceButtonTextSelected,
                    ]}
                  >
                    {price}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance</Text>
            <View style={styles.distanceGrid}>
              {DISTANCES.map(({ label, value }) => (
                <Pressable
                  key={value}
                  onPress={() => setSelectedDistance(value)}
                  style={[
                    styles.distanceButton,
                    selectedDistance === value && styles.distanceButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.distanceButtonText,
                      selectedDistance === value &&
                        styles.distanceButtonTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Open Now */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Open Now</Text>
              <Switch
                value={openNow}
                onValueChange={setOpenNow}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {/* Minimum Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingGrid}>
              {[0, 3, 3.5, 4, 4.5].map((rating) => (
                <Pressable
                  key={rating}
                  onPress={() => setMinRating(rating)}
                  style={[
                    styles.ratingButton,
                    minRating === rating && styles.ratingButtonSelected,
                  ]}
                >
                  <Ionicons
                    name="star"
                    size={16}
                    color={
                      minRating === rating ? colors.white : colors.warning
                    }
                  />
                  <Text
                    style={[
                      styles.ratingButtonText,
                      minRating === rating && styles.ratingButtonTextSelected,
                    ]}
                  >
                    {rating === 0 ? 'Any' : `${rating}+`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleApply}
            style={({ pressed }) => [
              styles.applyButton,
              pressed && styles.applyButtonPressed,
            ]}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clearButton: {
    ...typography.callout,
    color: colors.primary,
  },
  title: {
    ...typography.headline,
    color: colors.gray900,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  priceGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priceButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  priceButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priceButtonText: {
    ...typography.headline,
    color: colors.gray700,
  },
  priceButtonTextSelected: {
    color: colors.white,
  },
  distanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  distanceButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gray100,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  distanceButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  distanceButtonText: {
    ...typography.callout,
    color: colors.gray700,
  },
  distanceButtonTextSelected: {
    color: colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    ...typography.headline,
    color: colors.gray900,
  },
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.xs,
  },
  ratingButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingButtonText: {
    ...typography.callout,
    color: colors.gray700,
  },
  ratingButtonTextSelected: {
    color: colors.white,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  applyButtonPressed: {
    opacity: 0.9,
  },
  applyButtonText: {
    ...typography.headline,
    color: colors.white,
  },
});
