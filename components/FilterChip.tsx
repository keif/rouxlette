import React from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '../theme';
import { supperClub } from '../theme/supperClub';

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
        return '#FFFFFF';
      case 'excluded':
        return '#FFFFFF';
      default:
        return supperClub.text;
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
          color="#FFFFFF"
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
          color="#FFFFFF"
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: supperClub.chipBorder,
  },
  chipIncluded: {
    backgroundColor: supperClub.primary,
  },
  chipExcluded: {
    backgroundColor: supperClub.error,
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
