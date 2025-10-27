import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';

interface Location {
  latitude: number;
  longitude: number;
}

interface LocationResult {
  address: string;
  location: Location;
  placeId: string;
}

interface LocationSearchProps {
  onLocationSelect: (result: LocationResult) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = 'Search for a location...',
  className = '',
  defaultValue = ''
}) => {
  const { isLoaded, google } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (!isLoaded || !google || !inputRef.current || autocompleteRef.current) {
      return;
    }

    try {
      // Initialize autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['place_id', 'formatted_address', 'geometry.location', 'name']
      });

      // Add place changed listener
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (place && place.geometry && place.geometry.location) {
          const result: LocationResult = {
            address: place.formatted_address || place.name || '',
            location: {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng()
            },
            placeId: place.place_id || ''
          };

          setInputValue(result.address);
          onLocationSelect(result);
        }
      });
    } catch (error) {
      console.error('Error initializing location search:', error);
    }
  }, [isLoaded, google, onLocationSelect]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleClearInput = () => {
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isLoaded) {
    return (
      <div className={`relative ${className}`}>
        <input
          type="text"
          placeholder="Loading location search..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
          disabled
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClearInput}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};