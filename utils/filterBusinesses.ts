import { BusinessProps } from '../hooks/useResults';
import { Filters } from '../context/state';

/**
 * Applies client-side filtering to a list of Yelp businesses
 * @param businesses Array of Yelp business objects from API
 * @param filters Current filter configuration
 * @returns Filtered array of businesses
 */
export function applyFilters(businesses: BusinessProps[], filters: Filters): BusinessProps[] {
  return businesses.filter(business => {
    // Category inclusion filter
    if (filters.categoryIds.length > 0) {
      const businessCategories = business.categories?.map(cat => cat.alias) || [];
      const hasMatchingCategory = filters.categoryIds.some(categoryId =>
        businessCategories.includes(categoryId)
      );
      if (!hasMatchingCategory) {
        return false;
      }
    }

    // Category exclusion filter
    if (filters.excludedCategoryIds.length > 0) {
      const businessCategories = business.categories?.map(cat => cat.alias) || [];
      const hasExcludedCategory = filters.excludedCategoryIds.some(categoryId =>
        businessCategories.includes(categoryId)
      );
      if (hasExcludedCategory) {
        return false;
      }
    }

    // Price filter
    if (filters.priceLevels.length > 0) {
      if (!business.price) {
        return false; // Exclude businesses without price information
      }
      const businessPriceLevel = business.price.length as 1|2|3|4;
      if (!filters.priceLevels.includes(businessPriceLevel)) {
        return false;
      }
    }

    // Open Now filter
    if (filters.openNow) {
      // For BusinessProps, check if business is closed
      if (business.is_closed) {
        return false; // Exclude closed businesses
      }
      
      // Require hours data to determine if currently open
      if (!business.hours || business.hours.length === 0) {
        return false; // Exclude businesses without hours data when filtering by openNow
      }
      
      const hoursData = business.hours[0];
      if (!hoursData || typeof hoursData.is_open_now !== 'boolean') {
        return false; // Exclude if we can't determine open status
      }
      
      if (!hoursData.is_open_now) {
        return false; // Exclude if not currently open
      }
    }

    // Distance filter (radius)
    if (business.distance && business.distance > filters.radiusMeters) {
      return false;
    }

    // Minimum rating filter
    if (filters.minRating > 0) {
      if (!business.rating || business.rating < filters.minRating) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Counts the number of active filters for badge display
 * @param filters Current filter configuration
 * @returns Number of active filters
 */
export function countActiveFilters(filters: Filters): number {
  let count = 0;

  if (filters.categoryIds.length > 0) count++;
  if (filters.excludedCategoryIds.length > 0) count++;
  if (filters.priceLevels.length > 0) count++;
  if (filters.openNow) count++;
  if (filters.radiusMeters !== 1600) count++; // Default is 1600m (~1 mile)
  if (filters.minRating > 0) count++;

  return count;
}

/**
 * Helper to convert miles to meters for radius calculations
 */
export const DISTANCE_OPTIONS = [
  { label: '0.5 mi', miles: 0.5, meters: 804 },
  { label: '1 mi', miles: 1, meters: 1609 },
  { label: '2 mi', miles: 2, meters: 3218 },
  { label: '5 mi', miles: 5, meters: 8047 },
  { label: '10 mi', miles: 10, meters: 16093 },
];

/**
 * Helper to get distance label from meters
 */
export function getDistanceLabel(meters: number): string {
  const option = DISTANCE_OPTIONS.find(opt => opt.meters === meters);
  if (option) {
    return option.label;
  }
  const miles = meters * 0.000621371;
  const roundedMiles = Math.round(miles * 10) / 10; // Round to 1 decimal place
  return `${roundedMiles} mi`;
}