import React, { useContext, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  Switch,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Config from '../../Config';
import { RootContext } from '../../context/RootContext';
import { setFilters, resetFilters } from '../../context/reducer';
import AppStyles from '../../AppStyles';
import { Text } from '../Themed';
import Divider from '../shared/Divider';
import { Filters } from '../../context/state';
import { DISTANCE_OPTIONS, getDistanceLabel } from '../../utils/filterBusinesses';

// Number of categories to show initially
const INITIAL_CATEGORY_COUNT = 12;

interface FiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

const FiltersSheet: React.FC<FiltersSheetProps> = ({ visible, onClose, testID }) => {

  const { state, dispatch } = useContext(RootContext);
  const [localFilters, setLocalFilters] = useState<Filters>(state.filters);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const handleApply = () => {
    dispatch(setFilters(localFilters));
    onClose();
  };

  const handleReset = () => {
    dispatch(resetFilters());
    setLocalFilters(state.filters);
    setShowAllCategories(false);
    onClose();
  };

  const handleClose = () => {
    setLocalFilters(state.filters); // Reset local changes
    onClose();
  };

  const updateLocalFilters = (updates: Partial<Filters>) => {
    setLocalFilters(prev => ({ ...prev, ...updates }));
  };

  // Price level handlers
  const togglePriceLevel = (level: 1|2|3|4) => {
    const newPriceLevels = localFilters.priceLevels.includes(level)
      ? localFilters.priceLevels.filter(p => p !== level)
      : [...localFilters.priceLevels, level];
    updateLocalFilters({ priceLevels: newPriceLevels });
  };

  // Three-state category toggle: Neutral → Exclude → Include → Neutral
  const toggleCategoryState = (categoryId: string) => {
    const isIncluded = localFilters.categoryIds.includes(categoryId);
    const isExcluded = localFilters.excludedCategoryIds.includes(categoryId);

    let newCategoryIds = [...localFilters.categoryIds];
    let newExcludedIds = [...localFilters.excludedCategoryIds];

    if (!isIncluded && !isExcluded) {
      // Neutral → Exclude
      newExcludedIds.push(categoryId);
    } else if (isExcluded) {
      // Exclude → Include
      newExcludedIds = newExcludedIds.filter(c => c !== categoryId);
      newCategoryIds.push(categoryId);
    } else {
      // Include → Neutral
      newCategoryIds = newCategoryIds.filter(c => c !== categoryId);
    }

    updateLocalFilters({
      categoryIds: newCategoryIds,
      excludedCategoryIds: newExcludedIds
    });
  };

  // Get category state for styling
  const getCategoryState = (categoryId: string): 'neutral' | 'include' | 'exclude' => {
    if (localFilters.categoryIds.includes(categoryId)) return 'include';
    if (localFilters.excludedCategoryIds.includes(categoryId)) return 'exclude';
    return 'neutral';
  };

  // Separate categories into selected (excluded + included) and neutral
  const selectedCategories = state.categories
    .filter(cat => {
      const catState = getCategoryState(cat.alias);
      return catState === 'include' || catState === 'exclude';
    })
    .sort((a, b) => {
      // Sort: excluded first, then included, alphabetical within each
      const stateA = getCategoryState(a.alias);
      const stateB = getCategoryState(b.alias);
      if (stateA !== stateB) {
        return stateA === 'exclude' ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });

  const neutralCategories = state.categories
    .filter(cat => getCategoryState(cat.alias) === 'neutral')
    .sort((a, b) => a.title.localeCompare(b.title));

  // Determine how many neutral categories to display
  const neutralCategoriesToShow = showAllCategories
    ? neutralCategories
    : neutralCategories.slice(0, INITIAL_CATEGORY_COUNT);
  const hasMoreCategories = neutralCategories.length > INITIAL_CATEGORY_COUNT;

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      transparent
      visible={visible}
      testID={testID}
    >
      <StatusBar backgroundColor={AppStyles.color.white} />
      <SafeAreaView style={{ flex: 1, backgroundColor: AppStyles.color.white }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Pressable
              style={({ pressed }) => [
                { padding: 8, opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
              ]}
              onPress={handleClose}
              android_ripple={{ color: 'grey', radius: 20, borderless: true }}
            >
              <Icon name="close" size={25} color="black" />
            </Pressable>
          </View>
          <Text style={styles.headerText}>Filters</Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Pressable
              style={({ pressed }) => [
                { padding: 8, opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
              ]}
              onPress={handleReset}
              android_ripple={{ color: 'grey', radius: 20, borderless: true }}
            >
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.headerShadow} />

        {/* Fixed Selected Categories - Always visible below header */}
        {selectedCategories.length > 0 && (
          <View style={styles.fixedSelectedSection}>
            <Text style={styles.fixedSelectedLabel}>
              {selectedCategories.length} selected
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fixedSelectedChips}
            >
              {selectedCategories.map(category => {
                const categoryState = getCategoryState(category.alias);
                return (
                  <Pressable
                    key={category.alias}
                    onPress={() => toggleCategoryState(category.alias)}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      categoryState === 'include' && styles.categoryChipIncluded,
                      categoryState === 'exclude' && styles.categoryChipExcluded,
                      { opacity: !Config.isAndroid && pressed ? 0.6 : 1 }
                    ]}
                    android_ripple={{ color: 'lightgrey' }}
                  >
                    {categoryState === 'include' && (
                      <Icon name="add" size={14} color={AppStyles.color.white} style={styles.categoryIcon} />
                    )}
                    {categoryState === 'exclude' && (
                      <Icon name="close" size={14} color={AppStyles.color.white} style={styles.categoryIcon} />
                    )}
                    <Text style={[styles.categoryChipText, styles.categoryChipTextSelected]}>
                      {category.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 16 }}
        >
          {/* Categories Filter - Unified 3-state */}
          {state.categories.length > 0 && (
            <>
              <View>
                <View style={styles.sectionTitleWrapper}>
                  <Text style={styles.sectionTitle}>Categories</Text>
                  <Text style={styles.sectionSubtitle}>
                    Tap to exclude · Tap again to include · Tap again to clear
                  </Text>
                </View>

                <View style={styles.categoryContainer}>
                  {neutralCategoriesToShow.map(category => (
                    <Pressable
                      key={category.alias}
                      onPress={() => toggleCategoryState(category.alias)}
                      style={({ pressed }) => [
                        styles.categoryChip,
                        { opacity: !Config.isAndroid && pressed ? 0.6 : 1 }
                      ]}
                      android_ripple={{ color: 'lightgrey' }}
                    >
                      <Text style={styles.categoryChipText}>
                        {category.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {hasMoreCategories && (
                  <Pressable
                    onPress={() => setShowAllCategories(!showAllCategories)}
                    style={({ pressed }) => [
                      styles.showMoreButton,
                      { opacity: !Config.isAndroid && pressed ? 0.6 : 1 }
                    ]}
                    android_ripple={{ color: 'lightgrey' }}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllCategories ? 'Show less' : `Show ${neutralCategories.length - INITIAL_CATEGORY_COUNT} more`}
                    </Text>
                    <Icon
                      name={showAllCategories ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                      size={20}
                      color={AppStyles.color.primary}
                    />
                  </Pressable>
                )}
              </View>

              <Divider />
            </>
          )}

          {/* Open Now Filter */}
          <View>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitle}>Open Now</Text>
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Only show restaurants that are currently open</Text>
              <Switch
                value={localFilters.openNow}
                onValueChange={(value) => updateLocalFilters({ openNow: value })}
                trackColor={{ false: AppStyles.color.greylight, true: AppStyles.color.roulette.green }}
                thumbColor={AppStyles.color.white}
              />
            </View>
          </View>

          <Divider />

          {/* Price Filter */}
          <View>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitle}>Price</Text>
            </View>
            <View style={styles.priceRowContainer}>
              {[1, 2, 3, 4].map(level => (
                <View key={level} style={styles.priceButtonContainer}>
                  <Pressable
                    onPress={() => togglePriceLevel(level as 1|2|3|4)}
                    style={({ pressed }) => [
                      styles.priceButton,
                      localFilters.priceLevels.includes(level as 1|2|3|4) && styles.priceButtonSelected,
                      { opacity: !Config.isAndroid && pressed ? 0.6 : 1 }
                    ]}
                    android_ripple={{ color: 'lightgrey' }}
                  >
                    <View style={styles.priceButtonText}>
                      {Array.from(Array(level).keys()).map(key => (
                        <Icon 
                          key={key} 
                          name="attach-money" 
                          size={18} 
                          color={localFilters.priceLevels.includes(level as 1|2|3|4) 
                            ? AppStyles.color.white 
                            : AppStyles.color.roulette.accent
                          } 
                        />
                      ))}
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          <Divider />

          {/* Distance Filter */}
          <View>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitle}>Distance</Text>
              <Text style={styles.sectionSubtitle}>
                {getDistanceLabel(localFilters.radiusMeters)}
              </Text>
            </View>
            <View style={styles.distanceContainer}>
              {DISTANCE_OPTIONS.map(option => (
                <Pressable
                  key={option.meters}
                  onPress={() => updateLocalFilters({ radiusMeters: option.meters })}
                  style={({ pressed }) => [
                    styles.distanceOption,
                    localFilters.radiusMeters === option.meters && styles.distanceOptionSelected,
                    { opacity: !Config.isAndroid && pressed ? 0.6 : 1 }
                  ]}
                  android_ripple={{ color: 'lightgrey' }}
                >
                  <Text style={[
                    styles.distanceOptionText,
                    localFilters.radiusMeters === option.meters && styles.distanceOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Divider />

          {/* Minimum Rating Filter */}
          <View>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              <Text style={styles.sectionSubtitle}>
                {localFilters.minRating > 0 ? `${localFilters.minRating}+ stars` : 'No minimum'}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              {[0, 1, 2, 3, 4].map(rating => (
                <Pressable
                  key={rating}
                  onPress={() => updateLocalFilters({ minRating: rating })}
                  style={({ pressed }) => [
                    styles.ratingOption,
                    localFilters.minRating === rating && styles.ratingOptionSelected,
                    { opacity: !Config.isAndroid && pressed ? 0.6 : 1 }
                  ]}
                  android_ripple={{ color: 'lightgrey' }}
                >
                  <View style={styles.ratingStars}>
                    {rating === 0 ? (
                      <Text style={[
                        styles.ratingOptionText,
                        localFilters.minRating === rating && styles.ratingOptionTextSelected
                      ]}>
                        Any
                      </Text>
                    ) : (
                      Array.from(Array(rating).keys()).map(key => (
                        <Icon 
                          key={key} 
                          name="star" 
                          size={16} 
                          color={localFilters.minRating === rating 
                            ? AppStyles.color.white 
                            : AppStyles.color.roulette.accent
                          } 
                        />
                      ))
                    )}
                    {rating > 0 && (
                      <Text style={[
                        styles.ratingPlusText,
                        localFilters.minRating === rating && styles.ratingOptionTextSelected
                      ]}>
                        +
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <Divider />

        {/* Apply Button */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
            ]}
            android_ripple={{ color: 'lightgrey' }}
            onPress={handleApply}
          >
            <Text style={styles.buttonText}>Apply Filters</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerText: {
    fontFamily: AppStyles.fonts.bold,
    fontSize: 22,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  resetText: {
    fontSize: 16,
    color: AppStyles.color.roulette.red,
    fontFamily: AppStyles.fonts.medium,
  },
  headerShadow: {
    backgroundColor: AppStyles.color.greydark,
    elevation: 4,
    height: Config.isAndroid ? 0.2 : 1,
  },
  fixedSelectedSection: {
    backgroundColor: AppStyles.color.gray50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppStyles.color.gray300,
  },
  fixedSelectedLabel: {
    fontSize: 12,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.gray500,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fixedSelectedChips: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitleWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: AppStyles.color.black,
    fontFamily: AppStyles.fonts.bold,
    fontSize: 18,
    paddingVertical: 8,
  },
  sectionSubtitle: {
    color: AppStyles.color.greylight,
    fontFamily: AppStyles.fonts.regular,
    fontSize: 14,
  },
  priceRowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  priceButtonContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  priceButton: {
    borderColor: AppStyles.color.roulette.accent,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  priceButtonSelected: {
    backgroundColor: AppStyles.color.roulette.accent,
  },
  priceButtonText: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: AppStyles.color.gray300,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    backgroundColor: 'transparent',
  },
  categoryChipIncluded: {
    backgroundColor: AppStyles.color.success,
    borderColor: AppStyles.color.success,
  },
  categoryChipExcluded: {
    backgroundColor: AppStyles.color.accentRed,
    borderColor: AppStyles.color.accentRed,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.gray500,
  },
  categoryChipTextSelected: {
    color: AppStyles.color.white,
  },
  categoryIcon: {
    marginRight: 4,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.primary,
    marginRight: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  switchLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greydark,
    marginRight: 16,
  },
  distanceContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  distanceOption: {
    flex: 1,
    borderColor: AppStyles.color.roulette.neutral,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  distanceOptionSelected: {
    backgroundColor: AppStyles.color.roulette.neutral,
  },
  distanceOptionText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.roulette.neutral,
  },
  distanceOptionTextSelected: {
    color: AppStyles.color.white,
  },
  ratingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ratingOption: {
    flex: 1,
    borderColor: AppStyles.color.roulette.accent,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  ratingOptionSelected: {
    backgroundColor: AppStyles.color.roulette.accent,
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingOptionText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.roulette.accent,
  },
  ratingOptionTextSelected: {
    color: AppStyles.color.white,
  },
  ratingPlusText: {
    fontSize: 12,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.roulette.accent,
    marginLeft: 2,
  },
  buttonContainer: {
    borderRadius: 24,
    elevation: 8,
    margin: 16,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: 'grey',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: AppStyles.color.roulette.accent,
    height: 48,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontFamily: AppStyles.fonts.bold,
    fontSize: 18,
  },
});

export default FiltersSheet;