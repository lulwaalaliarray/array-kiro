import axios from 'axios';
import {
  GeoLocation,
  LocationSearchRequest,
  LocationSearchResult,
  PlaceSearchRequest,
  PlaceResult
} from '../types/user';
import { logger } from '../utils/logger';

export class GoogleMapsService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor() {
    this.apiKey = process.env['GOOGLE_MAPS_API_KEY'] || '';
    if (!this.apiKey) {
      logger.warn('Google Maps API key not configured');
    }
  }

  // Search for places using Google Places API
  async searchPlaces(request: PlaceSearchRequest): Promise<PlaceResult[]> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const params = new URLSearchParams({
        query: request.query,
        key: this.apiKey
      });

      if (request.location) {
        params.append('location', `${request.location.latitude},${request.location.longitude}`);
      }

      if (request.radius) {
        params.append('radius', request.radius.toString());
      }

      if (request.type) {
        params.append('type', request.type);
      }

      const response = await axios.get(`${this.baseUrl}/place/textsearch/json?${params}`);

      if (response.data.status !== 'OK') {
        logger.error('Google Places API error:', response.data.status);
        return [];
      }

      return response.data.results.map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        geometry: {
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          }
        },
        rating: place.rating,
        types: place.types
      }));
    } catch (error) {
      logger.error('Error searching places:', error);
      return [];
    }
  }

  // Search for nearby healthcare providers
  async searchNearbyProviders(request: LocationSearchRequest): Promise<LocationSearchResult[]> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      let searchQuery = request.query;
      
      // Add type-specific keywords to improve search results
      switch (request.type) {
        case 'doctor':
          searchQuery += ' doctor clinic medical';
          break;
        case 'hospital':
          searchQuery += ' hospital medical center';
          break;
        case 'clinic':
          searchQuery += ' clinic medical center';
          break;
      }

      const placeRequest: PlaceSearchRequest = {
        query: searchQuery,
        radius: request.radius || 10000, // Default 10km radius
        type: 'health'
      };

      if (request.location) {
        placeRequest.location = request.location;
      }

      const places = await this.searchPlaces(placeRequest);

      return places.map(place => ({
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        type: this.determineProviderType(place.types),
        rating: place.rating || 0,
        distance: request.location ? 
          this.calculateDistance(
            request.location,
            {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng
            }
          ) : 0
      }));
    } catch (error) {
      logger.error('Error searching nearby providers:', error);
      return [];
    }
  }

  // Geocode an address to get coordinates
  async geocodeAddress(address: string): Promise<GeoLocation | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const params = new URLSearchParams({
        address: address,
        key: this.apiKey
      });

      const response = await axios.get(`${this.baseUrl}/geocode/json?${params}`);

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        logger.error('Geocoding failed:', response.data.status);
        return null;
      }

      const location = response.data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    } catch (error) {
      logger.error('Error geocoding address:', error);
      return null;
    }
  }

  // Reverse geocode coordinates to get address
  async reverseGeocode(location: GeoLocation): Promise<string | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const params = new URLSearchParams({
        latlng: `${location.latitude},${location.longitude}`,
        key: this.apiKey
      });

      const response = await axios.get(`${this.baseUrl}/geocode/json?${params}`);

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        logger.error('Reverse geocoding failed:', response.data.status);
        return null;
      }

      return response.data.results[0].formatted_address;
    } catch (error) {
      logger.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(point1: GeoLocation, point2: GeoLocation): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * 
      Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  // Get distance matrix between multiple origins and destinations
  async getDistanceMatrix(
    origins: GeoLocation[],
    destinations: GeoLocation[]
  ): Promise<number[][]> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const originsStr = origins.map(o => `${o.latitude},${o.longitude}`).join('|');
      const destinationsStr = destinations.map(d => `${d.latitude},${d.longitude}`).join('|');

      const params = new URLSearchParams({
        origins: originsStr,
        destinations: destinationsStr,
        units: 'metric',
        key: this.apiKey
      });

      const response = await axios.get(`${this.baseUrl}/distancematrix/json?${params}`);

      if (response.data.status !== 'OK') {
        logger.error('Distance Matrix API error:', response.data.status);
        return [];
      }

      const distances: number[][] = [];
      response.data.rows.forEach((row: any, i: number) => {
        distances[i] = [];
        row.elements.forEach((element: any, j: number) => {
          if (element?.status === 'OK' && element?.distance?.value) {
            distances[i]![j] = element.distance.value / 1000; // Convert to kilometers
          } else {
            distances[i]![j] = -1; // Indicate error
          }
        });
      });

      return distances;
    } catch (error) {
      logger.error('Error getting distance matrix:', error);
      return [];
    }
  }

  // Helper method to convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Helper method to determine provider type from Google Places types
  private determineProviderType(types: string[]): 'doctor' | 'hospital' | 'clinic' {
    if (types.includes('hospital')) {
      return 'hospital';
    } else if (types.includes('doctor') || types.includes('dentist')) {
      return 'doctor';
    } else {
      return 'clinic';
    }
  }

  // Validate API key configuration
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const googleMapsService = new GoogleMapsService();