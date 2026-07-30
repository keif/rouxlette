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
import Slider from '@react-native-community/slider';
import Config from '../../Config';
import { RootContext } from '../../context/RootContext';
import { setFilters, resetFilters, toggleDealbreaker } from '../../context/reducer';
import { COMMON_CUISINES } from '../../constants/foodCategories';
import AppStyles from '../../AppStyles';
import { supperClub } from '../../theme/supperClub';
import { Text } from '../Themed';
import Divider from '../shared/Divider';
import { Filters } from '../../context/state';
import { getDistanceLabel } from '../../utils/filterBusinesses';

// Number of categories to show initially
const INITIAL_CATEGORY_COUNT = 12;

// Distance slider bounds (meters). Yelp caps its search radius at 40,000 m (~25 mi).
const MIN_RADIUS_METERS = 804;    // 0.5 mi
const MAX_RADIUS_METERS = 40000;  // ~25 mi (Yelp maximum)
const RADIUS_STEP_METERS = 804;   // ~0.5 mi increments

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

  // Distance handler — clamp defensively to the Yelp-supported range.
  const handleRadiusChange = (value: number) => {
    const clamped = Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, value));
    updateLocalFilters({ radiusMeters: Math.round(clamped) });
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
      <StatusBar backgroundColor={supperClub.background} />
      <SafeAreaView style={{ flex: 1, backgroundColor: supperClub.background }}>
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
              <Icon name="close" size={25} color={supperClub.text} />
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
                      color={supperClub.gold}
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
                trackColor={{ false: supperClub.textMuted, true: supperClub.success }}
                thumbColor={'#FFFFFF'}
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
                            ? '#FFFFFF'
                            : supperClub.gold
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
              <Slider
                testID="distance-slider"
                style={styles.distanceSlider}
                minimumValue={MIN_RADIUS_METERS}
                maximumValue={MAX_RADIUS_METERS}
                step={RADIUS_STEP_METERS}
                value={localFilters.radiusMeters}
                onValueChange={handleRadiusChange}
                minimumTrackTintColor={supperClub.gold}
                maximumTrackTintColor={supperClub.borderSoft}
                thumbTintColor={supperClub.gold}
                accessibilityLabel="Search distance"
                accessibilityHint="Adjusts how far to search for restaurants"
              />
              <View style={styles.distanceScaleRow}>
                <Text style={styles.distanceScaleLabel}>0.5 mi</Text>
                <Text style={styles.distanceScaleLabel}>25 mi</Text>
              </View>
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
                            ? '#FFFFFF'
                            : supperClub.gold
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

          <Divider />

          {/* Never show me — standing "dealbreaker" preference. Unlike the
              per-search cuisine chips above, tapping here dispatches immediately
              and persists; it is NOT routed through the local Apply flow. */}
          <View>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitle}>Never show me</Text>
              <Text style={styles.sectionSubtitle}>Always hidden</Text>
            </View>
            <View style={styles.categoryContainer}>
              {COMMON_CUISINES.map(cuisine => {
                const isActive = state.dealbreakerCategoryIds.includes(cuisine.alias);
                return (
                  <Pressable
                    key={cuisine.alias}
                    testID={`dealbreaker-${cuisine.alias}`}
                    onPress={() => dispatch(toggleDealbreaker(cuisine.alias))}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      isActive && styles.dealbreakerChipActive,
                      { opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
                    ]}
                    android_ripple={{ color: 'lightgrey' }}
                  >
                    <Icon
                      name="block"
                      size={14}
                      color={isActive ? '#FFFFFF' : supperClub.textMuted}
                      style={styles.categoryIcon}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isActive && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cuisine.label}
                    </Text>
                  </Pressable>
                );
              })}
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
    color: '#FFFFFF',
  },
  resetText: {
    fontSize: 16,
    color: supperClub.textMuted,
    fontFamily: AppStyles.fonts.medium,
  },
  headerShadow: {
    backgroundColor: supperClub.borderSoft,
    elevation: 4,
    height: Config.isAndroid ? 0.2 : 1,
  },
  fixedSelectedSection: {
    backgroundColor: supperClub.surfaceElevated,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: supperClub.borderSoft,
  },
  fixedSelectedLabel: {
    fontSize: 12,
    fontFamily: AppStyles.fonts.medium,
    color: supperClub.textMuted,
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
    color: '#FFFFFF',
    fontFamily: AppStyles.fonts.bold,
    fontSize: 18,
    paddingVertical: 8,
  },
  sectionSubtitle: {
    color: supperClub.textMuted,
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
    borderColor: supperClub.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  priceButtonSelected: {
    backgroundColor: supperClub.primary,
    borderColor: supperClub.primary,
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
    borderColor: supperClub.borderSoft,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryChipIncluded: {
    backgroundColor: supperClub.success,
    borderColor: supperClub.success,
  },
  categoryChipExcluded: {
    backgroundColor: supperClub.error,
    borderColor: supperClub.error,
  },
  // Intentionally shares the error tint with categoryChipExcluded but kept
  // separate: they express different domain concepts (a standing dealbreaker vs
  // a per-search exclude), so a future restyle of one must not silently change
  // the other. Do not merge these two styles.
  dealbreakerChipActive: {
    backgroundColor: supperClub.error,
    borderColor: supperClub.error,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: supperClub.text,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
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
    color: supperClub.gold,
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
    color: supperClub.text,
    marginRight: 16,
  },
  distanceContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  distanceSlider: {
    width: '100%',
    height: 44,
  },
  distanceScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  distanceScaleLabel: {
    fontSize: 12,
    fontFamily: AppStyles.fonts.regular,
    color: supperClub.textMuted,
  },
  ratingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ratingOption: {
    flex: 1,
    borderColor: supperClub.borderSoft,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  ratingOptionSelected: {
    backgroundColor: supperClub.primary,
    borderColor: supperClub.primary,
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
    color: supperClub.gold,
  },
  ratingOptionTextSelected: {
    color: '#FFFFFF',
  },
  ratingPlusText: {
    fontSize: 12,
    fontFamily: AppStyles.fonts.regular,
    color: supperClub.gold,
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
    backgroundColor: supperClub.primary,
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