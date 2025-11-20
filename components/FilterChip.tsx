import React from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

export type FilterChipVariant = 'default' | 'included' | 'excluded';

interface FilterChipProps {
  label: string;
  variant?: FilterChipVariant;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  variant = 'default',
  onPress,
  onLongPress,
}) => {
  const getChipStyle = () => {
    switch (variant) {
      case 'included':
        return styles.chipIncluded;
      case 'excluded':
        return styles.chipExcluded;
      default:
        return styles.chipDefault;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'included':
        return colors.white;
      case 'excluded':
        return colors.white;
      default:
        return colors.gray700;
    }
  };

  const showIcon = variant !== 'default';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.chip,
        getChipStyle(),
        pressed && styles.chipPressed,
      ]}
    >
      {variant === 'excluded' && (
        <Ionicons
          name="remove-circle"
          size={14}
          color={colors.white}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, { color: getTextColor() }]}>
        {label}
      </Text>
      {variant === 'included' && (
        <Ionicons
          name="checkmark-circle"
          size={14}
          color={colors.white}
          style={styles.iconRight}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.lg,
    height: 32,
  },
  chipDefault: {
    backgroundColor: colors.gray200,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  chipIncluded: {
    backgroundColor: colors.primary,
  },
  chipExcluded: {
    backgroundColor: colors.error,
  },
  chipPressed: {
    opacity: 0.8,
  },
  label: {
    ...typography.subheadline,
    fontWeight: '600',
  },
  icon: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});
