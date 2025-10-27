import React, { createContext, useContext, useEffect, useState } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | null;
  google: typeof window.google | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
  google: null
});

interface GoogleMapsProviderProps {
  children: React.ReactNode;
  apiKey: string;
  libraries?: string[];
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  children,
  apiKey,
  libraries = ['places', 'geometry']
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [google, setGoogle] = useState<typeof window.google | null>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      setGoogle(window.google);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for the existing script to load
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          setGoogle(window.google);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        setGoogle(window.google);
      } else {
        setLoadError(new Error('Google Maps failed to load'));
      }
    };

    script.onerror = () => {
      setLoadError(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [apiKey, libraries]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, google }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};