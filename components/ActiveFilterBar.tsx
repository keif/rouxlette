import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { FilterChip } from './FilterChip';
import { spacing } from '../theme';

export interface ActiveFilter {
  id: string;
  label: string;
  variant: 'included' | 'excluded';
  onRemove: () => void;
}

interface ActiveFilterBarProps {
  filters: ActiveFilter[];
}

export const ActiveFilterBar: React.FC<ActiveFilterBarProps> = ({ filters }) => {
  if (filters.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <View key={filter.id} style={styles.chipWrapper}>
            <FilterChip
              label={filter.label}
              variant={filter.variant}
              onPress={filter.onRemove}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  chipWrapper: {
    marginRight: spacing.sm,
  },
});
