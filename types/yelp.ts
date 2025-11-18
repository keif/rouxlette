export interface YelpBusinessHours {
  hours_type: string;
  is_open_now: boolean;
  open: Array<{
    day: number;
    start: string;
    end: string;
    is_overnight: boolean;
  }>;
}

export interface YelpBusiness {
  id: string
  name: string
  url?: string
  rating?: number
  review_count?: number
  price?: string
  categories?: { alias: string; title: string }[]
  image_url?: string
  photos?: string[]  // Array of photo URLs from /businesses/{id} endpoint
  distance?: number
  phone?: string
  display_phone?: string
  location?: { display_address?: string[]; address1?: string }
  hours?: YelpBusinessHours[]
  attributes?: Record<string, unknown>
}