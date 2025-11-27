import { CategoryProps } from '../hooks/useResults';

/**
 * Non-food category aliases that should be filtered out of results.
 * These can slip through when searching generic terms like "food" near auto shops.
 * Used as a safety net in addition to API-level category filtering.
 */
export const BLOCKED_CATEGORY_ALIASES: string[] = [
  // Automotive
  'auto',
  'autorepair',
  'autoglass',
  'bodyshops',
  'carwash',
  'servicestations',
  'tires',
  'oilchange',
  'smog_check_stations',
  'transmissionrepair',
  'autodealers',
  'usedcardealers',
  'carrental',
  'parking',
  'truckrepair',
  'motorcyclerepair',
  'boatrepair',
  'rvrepair',

  // Home services
  'plumbing',
  'electricians',
  'hvac',
  'contractors',
  'handyman',
  'locksmiths',
  'roofing',
  'movers',
  'homecleaning',
  'landscaping',
  'pestcontrol',
  'painters',
  'flooring',

  // Professional services
  'lawyers',
  'accountants',
  'financialservices',
  'insurance',
  'realestate',
  'realestateagents',

  // Health (non-food)
  'dentists',
  'physicians',
  'chiropractors',
  'optometrists',
  'veterinarians',
  'urgent_care',
  'hospitals',
  'pharmacies',

  // Retail (non-food)
  'electronics',
  'furniture',
  'clothing',
  'jewelry',
  'sportgoods',
  'hardware',
  'homeandgarden',

  // Other non-food
  'gyms',
  'hair',
  'spas',
  'nailsalons',
  'drycleaninglaundry',
  'shipping_centers',
  'printingservices',
  'notaries',
  'petservices',
  'petboarding',
  'funeral_services',
  'selfstorage',
];

/**
 * Check if a business has any blocked categories
 * @param categoryAliases Array of category aliases from a business
 * @returns true if any category is in the blocklist
 */
export function hasBlockedCategory(categoryAliases: string[]): boolean {
  return categoryAliases.some(alias =>
    BLOCKED_CATEGORY_ALIASES.includes(alias.toLowerCase())
  );
}

/**
 * Curated list of popular food and restaurant categories for filtering.
 * These align with Yelp's category aliases.
 *
 * Since the Yelp /categories endpoint requires developer beta access,
 * we use this static list for immediate filtering capability.
 */
export const FOOD_CATEGORIES: CategoryProps[] = [
  // Broad categories
  { alias: 'restaurants', title: 'Restaurants' },
  { alias: 'food', title: 'Food' },

  // Cuisine types - American
  { alias: 'newamerican', title: 'American (New)' },
  { alias: 'tradamerican', title: 'American (Traditional)' },
  { alias: 'southern', title: 'Southern' },
  { alias: 'soulfood', title: 'Soul Food' },

  // Asian
  { alias: 'chinese', title: 'Chinese' },
  { alias: 'japanese', title: 'Japanese' },
  { alias: 'sushi', title: 'Sushi' },
  { alias: 'thai', title: 'Thai' },
  { alias: 'vietnamese', title: 'Vietnamese' },
  { alias: 'korean', title: 'Korean' },
  { alias: 'indian', title: 'Indian' },
  { alias: 'asian', title: 'Asian Fusion' },

  // European
  { alias: 'italian', title: 'Italian' },
  { alias: 'french', title: 'French' },
  { alias: 'spanish', title: 'Spanish' },
  { alias: 'greek', title: 'Greek' },
  { alias: 'german', title: 'German' },

  // Mediterranean & Middle Eastern
  { alias: 'mediterranean', title: 'Mediterranean' },
  { alias: 'mideastern', title: 'Middle Eastern' },
  { alias: 'turkish', title: 'Turkish' },
  { alias: 'lebanese', title: 'Lebanese' },

  // Latin American
  { alias: 'mexican', title: 'Mexican' },
  { alias: 'latin', title: 'Latin American' },
  { alias: 'brazilian', title: 'Brazilian' },
  { alias: 'caribbean', title: 'Caribbean' },

  // Specific food types
  { alias: 'pizza', title: 'Pizza' },
  { alias: 'burgers', title: 'Burgers' },
  { alias: 'sandwiches', title: 'Sandwiches' },
  { alias: 'seafood', title: 'Seafood' },
  { alias: 'steakhouses', title: 'Steakhouses' },
  { alias: 'bbq', title: 'Barbecue' },
  { alias: 'hotdogs', title: 'Hot Dogs' },
  { alias: 'chicken_wings', title: 'Chicken Wings' },
  { alias: 'tacos', title: 'Tacos' },

  // Meal types
  { alias: 'breakfast_brunch', title: 'Breakfast & Brunch' },
  { alias: 'cafes', title: 'Cafes' },
  { alias: 'diners', title: 'Diners' },
  { alias: 'buffets', title: 'Buffets' },

  // Fast food & casual
  { alias: 'fastfood', title: 'Fast Food' },
  { alias: 'food_court', title: 'Food Court' },
  { alias: 'delis', title: 'Delis' },

  // Drinks & desserts
  { alias: 'coffee', title: 'Coffee & Tea' },
  { alias: 'bars', title: 'Bars' },
  { alias: 'wine_bars', title: 'Wine Bars' },
  { alias: 'desserts', title: 'Desserts' },
  { alias: 'icecream', title: 'Ice Cream' },
  { alias: 'bakeries', title: 'Bakeries' },
  { alias: 'juicebars', title: 'Juice Bars' },
  { alias: 'bubbletea', title: 'Bubble Tea' },

  // Dietary
  { alias: 'vegetarian', title: 'Vegetarian' },
  { alias: 'vegan', title: 'Vegan' },
  { alias: 'gluten_free', title: 'Gluten-Free' },
  { alias: 'halal', title: 'Halal' },
  { alias: 'kosher', title: 'Kosher' },
];

/**
 * Get categories sorted alphabetically by title
 */
export function getSortedCategories(): CategoryProps[] {
  return [...FOOD_CATEGORIES].sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Get top N most popular categories (as determined by our curation)
 */
export function getPopularCategories(limit: number = 12): CategoryProps[] {
  // Return the first N categories (already ordered by popularity)
  return FOOD_CATEGORIES.slice(0, limit);
}

/**
 * Find a category by alias
 */
export function getCategoryByAlias(alias: string): CategoryProps | undefined {
  return FOOD_CATEGORIES.find(cat => cat.alias === alias);
}
