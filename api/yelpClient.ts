/**
 * Enhanced Yelp API client with safe logging and payload size management
 * 
 * This wrapper prevents PayloadTooLargeError by logging only metadata
 * and essential information instead of full API responses.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { YELP_API_KEY } from '@env';
import { logNetwork, logSafe, logPerf } from '../utils/log';

/**
 * Yelp API response metadata (safe for logging)
 */
interface YelpResponseMetadata {
  businessCount: number;
  total?: number;
  regionCenter?: string;
  hasMoreResults: boolean;
  categories?: string[];
  averageRating?: number;
  priceRange?: string[];
}

/**
 * Search parameters (safe for logging)
 */
interface SearchParams {
  term?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  categories?: string;
  price?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  open_now?: boolean;
}

/**
 * Enhanced Yelp client with instrumentation
 */
class YelpClient {
  private client: AxiosInstance;
  private requestCount = 0;
  private lastRequestTime = 0;
  
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.yelp.com/v3',
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => this.logRequest(config),
      (error) => this.logRequestError(error)
    );
    
    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => this.logResponse(response),
      (error) => this.logResponseError(error)
    );
  }
  
  /**
   * Search businesses with safe logging
   */
  async searchBusinesses(params: SearchParams) {
    const startTime = performance.now();
    this.requestCount++;
    
    try {
      logSafe('YelpClient:searchBusinesses:start', {
        term: params.term,
        location: params.location || `${params.latitude},${params.longitude}`,
        radius: params.radius,
        limit: params.limit,
        requestNumber: this.requestCount
      });
      
      const response = await this.client.get('/businesses/search', { params });
      const duration = performance.now() - startTime;
      
      // Extract safe metadata
      const metadata = this.extractResponseMetadata(response.data);
      
      logNetwork('GET', '/businesses/search', params, {
        status: response.status,
        data: metadata,
        duration
      });
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        this.logApiError(error, '/businesses/search', params, duration);
      } else {
        logSafe('YelpClient:searchBusinesses:unknown-error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          duration
        });
      }
      
      throw error;
    } finally {
      this.lastRequestTime = Date.now();
    }
  }
  
  /**
   * Get business details with safe logging
   */
  async getBusinessDetails(businessId: string) {
    const startTime = performance.now();
    this.requestCount++;
    
    try {
      logSafe('YelpClient:getBusinessDetails:start', {
        businessId,
        requestNumber: this.requestCount
      });
      
      const response = await this.client.get(`/businesses/${businessId}`);
      const duration = performance.now() - startTime;
      
      // Log only essential business metadata
      const business = response.data;
      const metadata = {
        id: business.id,
        name: business.name,
        rating: business.rating,
        reviewCount: business.review_count,
        categories: business.categories?.length || 0,
        photos: business.photos?.length || 0,
        hours: business.hours ? 'present' : 'absent'
      };
      
      logNetwork('GET', `/businesses/${businessId}`, undefined, {
        status: response.status,
        data: metadata,
        duration
      });
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        this.logApiError(error, `/businesses/${businessId}`, undefined, duration);
      }
      
      throw error;
    }
  }
  
  /**
   * Get business reviews with safe logging
   */
  async getBusinessReviews(businessId: string, limit: number = 20) {
    const startTime = performance.now();
    this.requestCount++;
    
    try {
      const response = await this.client.get(`/businesses/${businessId}/reviews`, {
        params: { limit }
      });
      const duration = performance.now() - startTime;
      
      // Log only review metadata, never full review text
      const reviews = response.data.reviews || [];
      const metadata = {
        reviewCount: reviews.length,
        averageRating: reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length || 0,
        dateRange: reviews.length > 0 ? {
          newest: reviews[0]?.time_created,
          oldest: reviews[reviews.length - 1]?.time_created
        } : null
      };
      
      logNetwork('GET', `/businesses/${businessId}/reviews`, { limit }, {
        status: response.status,
        data: metadata,
        duration
      });
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        this.logApiError(error, `/businesses/${businessId}/reviews`, { limit }, duration);
      }
      
      throw error;
    }
  }
  
  /**
   * Get categories (cached for performance)
   */
  private categoriesCache: any = null;
  private categoriesCacheTime = 0;
  private readonly CATEGORIES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  async getCategories() {
    const now = Date.now();
    
    // Return cached categories if still fresh
    if (this.categoriesCache && (now - this.categoriesCacheTime) < this.CATEGORIES_CACHE_TTL) {
      logSafe('YelpClient:getCategories:cache-hit', {
        categoriesCount: this.categoriesCache?.categories?.length || 0,
        cacheAge: now - this.categoriesCacheTime
      });
      return { data: this.categoriesCache };
    }
    
    const startTime = performance.now();
    this.requestCount++;
    
    try {
      const response = await this.client.get('/categories');
      const duration = performance.now() - startTime;
      
      // Cache the response
      this.categoriesCache = response.data;
      this.categoriesCacheTime = now;
      
      logNetwork('GET', '/categories', undefined, {
        status: response.status,
        data: {
          categoriesCount: response.data.categories?.length || 0,
          cached: false
        },
        duration
      });
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        this.logApiError(error, '/categories', undefined, duration);
      }
      
      throw error;
    }
  }
  
  /**
   * Get client statistics for debugging
   */
  getStats() {
    return {
      totalRequests: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      categoriesCached: !!this.categoriesCache,
      categoriesCacheAge: this.categoriesCacheTime ? Date.now() - this.categoriesCacheTime : 0
    };
  }
  
  /**
   * Clear caches and reset stats
   */
  reset() {
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.categoriesCache = null;
    this.categoriesCacheTime = 0;
    
    logSafe('YelpClient:reset', 'Client state reset');
  }
  
  // Private helper methods
  
  private logRequest(config: any) {
    // Don't log the full config, just essential info
    logSafe('YelpClient:request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasParams: !!config.params,
      timeout: config.timeout,
      requestId: this.requestCount + 1
    });
    
    return config;
  }
  
  private logRequestError(error: any) {
    logSafe('YelpClient:request-error', {
      message: error.message,
      code: error.code
    });
    
    return Promise.reject(error);
  }
  
  private logResponse(response: AxiosResponse) {
    // Log response metadata only
    const contentLength = response.headers['content-length'];
    const rateLimit = response.headers['ratelimit-remaining'];
    
    logSafe('YelpClient:response', {
      status: response.status,
      contentLength: contentLength ? parseInt(contentLength) : undefined,
      rateLimitRemaining: rateLimit ? parseInt(rateLimit) : undefined,
      dataType: typeof response.data,
      requestId: this.requestCount
    });
    
    return response;
  }
  
  private logResponseError(error: AxiosError) {
    this.logApiError(error, error.config?.url || 'unknown', error.config?.params);
    return Promise.reject(error);
  }
  
  private logApiError(
    error: AxiosError, 
    endpoint: string, 
    params?: any, 
    duration?: number
  ) {
    const errorData: any = {
      endpoint,
      status: error.response?.status,
      statusText: error.response?.statusText,
      code: error.code,
      duration
    };
    
    // Include safe parameter info
    if (params) {
      errorData.params = {
        term: params.term,
        location: params.location,
        limit: params.limit,
        // Don't log sensitive params like API keys
      };
    }
    
    // Include rate limiting info if present
    if (error.response?.headers['ratelimit-remaining']) {
      errorData.rateLimitRemaining = error.response.headers['ratelimit-remaining'];
    }
    
    // Include error message from response if available and safe
    if (error.response?.data?.error?.description) {
      errorData.errorDescription = error.response.data.error.description;
    }
    
    logSafe('YelpClient:api-error', errorData);
  }
  
  private extractResponseMetadata(data: any): YelpResponseMetadata {
    const businesses = data.businesses || [];
    
    const metadata: YelpResponseMetadata = {
      businessCount: businesses.length,
      total: data.total,
      hasMoreResults: data.total > businesses.length,
    };
    
    if (data.region?.center) {
      metadata.regionCenter = `${data.region.center.latitude},${data.region.center.longitude}`;
    }
    
    if (businesses.length > 0) {
      // Extract category summary
      const allCategories = businesses.flatMap((b: any) => b.categories || []);
      const uniqueCategories = [...new Set(allCategories.map((c: any) => c.title))];
      metadata.categories = uniqueCategories.slice(0, 5); // First 5 categories
      
      // Calculate average rating
      const ratings = businesses.map((b: any) => b.rating).filter(Boolean);
      if (ratings.length > 0) {
        metadata.averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      }
      
      // Extract price range
      const prices = [...new Set(businesses.map((b: any) => b.price).filter(Boolean))];
      if (prices.length > 0) {
        metadata.priceRange = prices.sort();
      }
    }
    
    return metadata;
  }
}

// Export singleton instance
const yelpClient = new YelpClient();
export default yelpClient;

// Also export the class for testing
export { YelpClient, type SearchParams, type YelpResponseMetadata };