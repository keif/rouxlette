import React from 'react';
import { StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { View } from '../Themed';
import AppStyles from '../../AppStyles';

export interface CategoryItem {
  title: string;
  emoji: string;
  term: string;
}

interface PopularCategoriesProps {
  categories: CategoryItem[];
  onSelect?: (term: string) => void;
  disabled?: boolean;
}

const PopularCategories: React.FC<PopularCategoriesProps> = ({
  categories,
  onSelect,
  disabled = false,
}) => {
  const handleCategoryPress = (term: string) => {
    if (disabled || !onSelect) return;
    onSelect(term);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Popular Categories</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            testID={`category-${category.term}`}
            onPress={() => handleCategoryPress(category.term)}
            style={[
              styles.categoryCard,
              disabled && styles.categoryCardDisabled
            ]}
            disabled={disabled}
          >
            <Text style={styles.emoji}>{category.emoji}</Text>
            <Text style={[
              styles.categoryTitle,
              disabled && styles.categoryTitleDisabled
            ]}>
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
  },
  title: {
    fontSize: 20,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: AppStyles.color.white,
    borderRadius: 16,
    marginHorizontal: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: AppStyles.color.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  categoryCardDisabled: {
    opacity: 0.6,
    backgroundColor: AppStyles.color.greylight,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
    textAlign: 'center',
  },
  categoryTitleDisabled: {
    color: AppStyles.color.grey,
  },
});

export default PopularCategories;