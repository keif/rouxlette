import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../Themed';
import AppStyles from '../../AppStyles';
import Config from '../../Config';

export type FilterChipVariant = 'inclusion' | 'exclusion' | 'inactive' | 'active';

interface FilterChipProps {
  label: string;
  variant?: FilterChipVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  variant = 'active',
  icon,
  onPress,
  onLongPress,
  style,
  testID,
}) => {
  const getChipStyle = () => {
    switch (variant) {
      case 'inclusion':
      case 'active':
        return styles.chipInclusion;
      case 'exclusion':
        return styles.chipExclusion;
      case 'inactive':
        return styles.chipInactive;
      default:
        return styles.chipInclusion;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'inclusion':
      case 'active':
        return AppStyles.color.white;
      case 'exclusion':
        return AppStyles.color.white;
      case 'inactive':
        return AppStyles.color.gray700;
      default:
        return AppStyles.color.white;
    }
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (icon) return icon;
    if (variant === 'exclusion') return 'remove-circle';
    if (variant === 'inclusion' || variant === 'active') return 'checkmark-circle';
    return 'ellipse-outline';
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        getChipStyle(),
        pressed && !Config.isAndroid && styles.chipPressed,
        style,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{
        color: 'rgba(255, 255, 255, 0.3)',
        borderless: true,
      }}
      testID={testID}
    >
      {icon && (
        <Ionicons
          name={getIconName()}
          size={14}
          color={getTextColor()}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, { color: getTextColor() }]}>
        {variant === 'exclusion' && !label.startsWith('–') ? '–' : ''}
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    ...AppStyles.chip.default,
    paddingVertical: 6,
  },
  chipInclusion: {
    ...AppStyles.chip.inclusion,
  },
  chipExclusion: {
    ...AppStyles.chip.exclusion,
  },
  chipInactive: {
    ...AppStyles.chip.inactive,
  },
  chipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  icon: {
    marginRight: 4,
  },
  label: {
    ...AppStyles.typography.subhead,
    fontWeight: '600',
  },
});

export default FilterChip;
