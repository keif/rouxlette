export interface FavoriteItem {
  id: string;               // Yelp business id
  name: string;
  categories: string[];     // lowercased category aliases or titles
  imageUrl?: string;
  rating?: number;
  price?: string;           // $, $$, etc.
  isClosed?: boolean;
  location?: { 
    city?: string; 
    address1?: string; 
    latitude?: number; 
    longitude?: number; 
  };
  addedAt: number;          // epoch ms
}

export interface HistoryItem {
  id: string;               // unique uuid for the history row
  businessId: string;       // Yelp business id
  name: string;
  selectedAt: number;       // epoch ms
  source: 'spin' | 'manual';
  context?: {
    searchTerm?: string;
    locationText?: string;
    coords?: { latitude: number; longitude: number };
    filters?: { 
      openNow?: boolean; 
      categories?: string[];
      priceLevels?: Array<1|2|3|4>;
      radiusMeters?: number;
      minRating?: number;
    };
  };
}

// Storage constants
export const STORAGE_KEYS = {
  FAVORITES: 'storage:favorites:v1',
  HISTORY: 'storage:history:v1',
} as const;

// Configuration constants
export const HISTORY_MAX_ITEMS = 200;
export const DEBOUNCE_PERSISTENCE_MS = 500;