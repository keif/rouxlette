import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { View } from '../Themed';
import AppStyles from '../../AppStyles';

interface CategoryCardProps {
  title: string;
  emoji: string;
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, emoji, onPress }) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 120,
    height: 100,
    marginHorizontal: 8,
    borderRadius: 16,
    backgroundColor: AppStyles.color.white,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
    textAlign: 'center',
  },
});

export default CategoryCard;