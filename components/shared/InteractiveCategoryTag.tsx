import React, { useContext } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { RootContext } from '../../context/RootContext';
import { toggleCategoryFilter } from '../../context/reducer';
import AppStyles from '../../AppStyles';
import { MaterialIcons } from '@expo/vector-icons';

export type CategoryFilterState = 'neutral' | 'exclude' | 'include';

interface InteractiveCategoryTagProps {
  alias: string;
  title: string;
}

export function InteractiveCategoryTag({ alias, title }: InteractiveCategoryTagProps) {
  const { state, dispatch } = useContext(RootContext);

  // Determine current state
  const isIncluded = state.filters.categoryIds.includes(alias);
  const isExcluded = state.filters.excludedCategoryIds.includes(alias);

  const filterState: CategoryFilterState = isExcluded
    ? 'exclude'
    : isIncluded
    ? 'include'
    : 'neutral';

  const handlePress = () => {
    dispatch(toggleCategoryFilter(alias));
  };

  // Style based on state
  const containerStyle = [
    styles.tag,
    filterState === 'exclude' && styles.tagExclude,
    filterState === 'include' && styles.tagInclude,
  ];

  const textStyle = [
    styles.tagText,
    filterState === 'exclude' && styles.tagTextExclude,
    filterState === 'include' && styles.tagTextInclude,
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        ...containerStyle,
        pressed && styles.tagPressed,
      ]}
      onPress={handlePress}
      android_ripple={{
        color: filterState === 'exclude'
          ? 'rgba(220, 38, 38, 0.2)'
          : filterState === 'include'
          ? 'rgba(34, 197, 94, 0.2)'
          : 'rgba(0, 0, 0, 0.1)',
      }}
    >
      {filterState !== 'neutral' && (
        <MaterialIcons
          name={filterState === 'exclude' ? 'remove-circle' : 'add-circle'}
          size={14}
          color={filterState === 'exclude' ? '#DC2626' : '#22C55E'}
          style={styles.icon}
        />
      )}
      <Text style={textStyle} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: AppStyles.color.greylight,
    backgroundColor: AppStyles.color.background,
    marginRight: 6,
    marginBottom: 6,
  },
  tagExclude: {
    borderColor: '#DC2626', // red-600
    backgroundColor: '#FEF2F2', // red-50
  },
  tagInclude: {
    borderColor: '#22C55E', // green-500
    backgroundColor: '#F0FDF4', // green-50
  },
  tagPressed: {
    opacity: 0.7,
  },
  tagText: {
    fontSize: 13,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
  },
  tagTextExclude: {
    color: '#DC2626', // red-600
  },
  tagTextInclude: {
    color: '#16A34A', // green-600
  },
  icon: {
    marginRight: 4,
  },
});
