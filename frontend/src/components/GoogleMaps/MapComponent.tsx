import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';

interface Location {
  latitude: number;
  longitude: number;
}

interface MapMarker {
  id: string;
  position: Location;
  title: string;
  info?: string;
  type?: 'doctor' | 'hospital' | 'clinic';
}

interface MapComponentProps {
  center: Location;
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (location: Location) => void;
  height?: string;
  width?: string;
  className?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom = 13,
  markers = [],
  onMarkerClick,
  onMapClick,
  height = '400px',
  width = '100%',
  className = ''
}) => {
  const { isLoaded, loadError, google } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !google || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    try {
      const mapOptions: google.maps.MapOptions = {
        center: { lat: center.latitude, lng: center.longitude },
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi.medical',
            elementType: 'geometry',
            stylers: [{ color: '#ffeaa7' }]
          },
          {
            featureType: 'poi.medical',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d63031' }]
          }
        ]
      };

      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);

      // Add click listener
      if (onMapClick) {
        mapInstanceRef.current.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            onMapClick({
              latitude: event.latLng.lat(),
              longitude: event.latLng.lng()
            });
          }
        });
      }

      setIsMapReady(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [isLoaded, google, center, zoom, onMapClick]);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && isMapReady) {
      mapInstanceRef.current.setCenter({ lat: center.latitude, lng: center.longitude });
    }
  }, [center, isMapReady]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !google) {
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create info window if it doesn't exist
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    // Add new markers
    markers.forEach(markerData => {
      const markerIcon = getMarkerIcon(markerData.type);
      
      const marker = new google.maps.Marker({
        position: { lat: markerData.position.latitude, lng: markerData.position.longitude },
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: markerIcon
      });

      // Add click listener
      marker.addListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(markerData);
        }

        // Show info window
        if (infoWindowRef.current && markerData.info) {
          infoWindowRef.current.setContent(`
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${markerData.title}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">${markerData.info}</p>
            </div>
          `);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      markersRef.current.push(marker);
    });
  }, [markers, isMapReady, google, onMarkerClick]);

  // Get marker icon based on type
  const getMarkerIcon = (type?: string): google.maps.Icon | undefined => {
    if (!google) return undefined;

    const iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
    
    switch (type) {
      case 'doctor':
        return {
          url: iconBase + 'doctor.png',
          scaledSize: new google.maps.Size(32, 32)
        };
      case 'hospital':
        return {
          url: iconBase + 'hospitals.png',
          scaledSize: new google.maps.Size(32, 32)
        };
      case 'clinic':
        return {
          url: iconBase + 'caduceus.png',
          scaledSize: new google.maps.Size(32, 32)
        };
      default:
        return undefined;
    }
  };

  if (loadError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded ${className}`}
        style={{ height, width }}
      >
        <div className="text-center text-red-600">
          <p>Error loading map</p>
          <p className="text-sm">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef}
      className={`border border-gray-300 rounded ${className}`}
      style={{ height, width }}
    />
  );
};