import { useState, useCallback } from 'react';

/**
 * Custom hook to manage user browser geolocation.
 * Handles navigator.geolocation API, permissions, timeouts, and custom coordinate overrides.
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = useCallback((customCoords = null) => {
    if (customCoords) {
      setCoords(customCoords);
      setError(null);
      setLoading(false);
      return Promise.resolve(customCoords);
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      const errMsg = 'Geolocation is not supported by your browser.';
      setError(errMsg);
      setLoading(false);
      return Promise.reject(new Error(errMsg));
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCoords(userCoords);
          setLoading(false);
          resolve(userCoords);
        },
        (err) => {
          let message = 'Unable to acquire your GPS position.';
          if (err.code === 1) {
            message = 'Location permission was denied. You can manually enter coordinates or pick a city preset.';
          } else if (err.code === 2) {
            message = 'Location information is unavailable.';
          } else if (err.code === 3) {
            message = 'Acquiring GPS position timed out.';
          }
          setError(message);
          setLoading(false);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  return {
    coords,
    setCoords,
    loading,
    error,
    setError,
    requestLocation
  };
}
