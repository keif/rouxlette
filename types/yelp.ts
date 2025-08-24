export interface YelpBusiness {
  id: string
  name: string
  url?: string
  rating?: number
  review_count?: number
  price?: string
  categories?: { alias: string; title: string }[]
  image_url?: string
  distance?: number
  phone?: string
  display_phone?: string
  location?: { display_address?: string[]; address1?: string }
  hours?: any[]  // precise type can come later
  attributes?: Record<string, unknown>
}