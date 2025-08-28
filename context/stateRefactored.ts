/**
 * Refactored state structure to prevent PayloadTooLargeError
 * 
 * This version keeps large data (full business objects, photos, etc.) out of
 * the global Context and only stores minimal references/IDs that can be
 * efficiently serialized by devtools and persistence layers.
 */

import { CategoryProps } from "../hooks/useResults";
import { YelpBusiness } from "../types/yelp";

// Minimal business reference for Context state
export interface BusinessRef {
  id: string;
  name: string;
  rating: number;
  price?: string;
  categories: { alias: string; title: string }[];
  is_closed: boolean;
  distance?: number;
}

// Minimal spin history without full business data
export interface SpinHistoryRef {
  businessId: string;
  businessName: string;
  timestamp: number;
}

// Results metadata without full business objects
export interface ResultsMetadata {
  id: string; // UUID for cache correlation
  count: number;
  searchTerm?: string;
  location?: string;
  timestamp: number;
  businessIds: string[]; // Just IDs, not full objects
}

/**
 * Slimmed down AppState - only essential data for UI state
 * Large data (businesses, photos, etc.) stored separately via hooks/refs
 */
export interface SlimAppState {
  // Filter and UI state (small, safe to serialize)
  filters: Filters;
  showFilter: boolean;
  
  // Location and search metadata (strings/numbers only)
  location: string;
  
  // Business selections (just IDs, not full objects)
  selectedBusinessId: string | null;
  isBusinessModalOpen: boolean;
  
  // Results metadata (no full business objects)
  resultsMetadata: ResultsMetadata | null;
  
  // Minimal history (just references)
  spinHistory: SpinHistoryRef[];
  favoriteBusinessIds: string[];
  
  // Categories (usually small, safe to keep)
  categories: CategoryProps[];
}

export interface Filters {
  categoryIds: string[];        // Yelp alias ids
  priceLevels: Array<1|2|3|4>;  // $, $$, $$$, $$$$
  openNow: boolean;
  radiusMeters: number;         // e.g., 1600 default ~1 mile
  minRating: number;            // 0–5
}

export const initialFilters: Filters = {
  categoryIds: [],
  priceLevels: [],
  openNow: false,
  radiusMeters: 1600, // ~1 mile default
  minRating: 0,
};

export const initialSlimAppState: SlimAppState = {
  filters: initialFilters,
  showFilter: false,
  location: ``,
  selectedBusinessId: null,
  isBusinessModalOpen: false,
  resultsMetadata: null,
  spinHistory: [],
  favoriteBusinessIds: [],
  categories: [],
};

/**
 * Business data store interface
 * This will be managed outside of Context (e.g., via useRef or separate hook)
 */
export interface BusinessDataStore {
  businesses: Map<string, YelpBusiness>;
  
  // Methods for safe access
  getBusiness(id: string): YelpBusiness | null;
  getBusinesses(ids: string[]): YelpBusiness[];
  addBusinesses(businesses: YelpBusiness[]): void;
  removeBusiness(id: string): void;
  clear(): void;
  getCount(): number;
}

/**
 * Create a business data store implementation
 */
export function createBusinessDataStore(): BusinessDataStore {
  const businesses = new Map<string, YelpBusiness>();
  
  return {
    businesses,
    
    getBusiness(id: string): YelpBusiness | null {
      return businesses.get(id) || null;
    },
    
    getBusinesses(ids: string[]): YelpBusiness[] {
      return ids.map(id => businesses.get(id)).filter(Boolean) as YelpBusiness[];
    },
    
    addBusinesses(newBusinesses: YelpBusiness[]): void {
      newBusinesses.forEach(business => {
        businesses.set(business.id, business);
      });
    },
    
    removeBusiness(id: string): void {
      businesses.delete(id);
    },
    
    clear(): void {
      businesses.clear();
    },
    
    getCount(): number {
      return businesses.size;
    }
  };
}

/**
 * Helper to convert full business object to reference
 */
export function businessToRef(business: YelpBusiness): BusinessRef {
  return {
    id: business.id,
    name: business.name,
    rating: business.rating,
    price: business.price,
    categories: business.categories?.slice(0, 2) || [], // Limit categories
    is_closed: business.is_closed,
    distance: business.distance
  };
}

/**
 * Helper to convert results to metadata
 */
export function resultsToMetadata(
  results: { id: string; businesses: YelpBusiness[] },
  searchTerm?: string,
  location?: string
): ResultsMetadata {
  return {
    id: results.id,
    count: results.businesses.length,
    searchTerm,
    location,
    timestamp: Date.now(),
    businessIds: results.businesses.map(b => b.id)
  };
}

/**
 * Type for the old state (for migration compatibility)
 */
export interface LegacyAppState {
  categories: CategoryProps[];
  detail: YelpBusiness | null;
  filter: any;
  filters: Filters;
  location: string;
  results: YelpBusiness[];
  showFilter: boolean;
  favorites: YelpBusiness[];
  spinHistory: Array<{ restaurant: YelpBusiness; timestamp: number }>;
  selectedBusiness: YelpBusiness | null;
  isBusinessModalOpen: boolean;
}

/**
 * Migration helper to convert legacy state to slim state
 */
export function migrateLegacyState(
  legacyState: LegacyAppState,
  businessStore: BusinessDataStore
): SlimAppState {
  // Store all business data in the business store
  const allBusinesses = [
    ...legacyState.results,
    ...legacyState.favorites,
    ...(legacyState.detail ? [legacyState.detail] : []),
    ...(legacyState.selectedBusiness ? [legacyState.selectedBusiness] : []),
    ...legacyState.spinHistory.map(h => h.restaurant)
  ].filter(Boolean);
  
  businessStore.addBusinesses(allBusinesses);
  
  // Create slim state with references only
  return {
    filters: legacyState.filters,
    showFilter: legacyState.showFilter,
    location: legacyState.location,
    selectedBusinessId: legacyState.selectedBusiness?.id || null,
    isBusinessModalOpen: legacyState.isBusinessModalOpen,
    resultsMetadata: legacyState.results.length > 0 ? {
      id: 'migrated',
      count: legacyState.results.length,
      timestamp: Date.now(),
      businessIds: legacyState.results.map(b => b.id)
    } : null,
    spinHistory: legacyState.spinHistory.map(h => ({
      businessId: h.restaurant.id,
      businessName: h.restaurant.name,
      timestamp: h.timestamp
    })),
    favoriteBusinessIds: legacyState.favorites.map(b => b.id),
    categories: legacyState.categories,
  };
}

export type { BusinessProps } from "../hooks/useResults"; // Re-export for compatibility