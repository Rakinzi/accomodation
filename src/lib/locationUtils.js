// src/lib/locationUtils.js

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of the first point
 * @param {number} lon1 - Longitude of the first point
 * @param {number} lat2 - Latitude of the second point
 * @param {number} lon2 - Longitude of the second point
 * @returns {number} - Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c // Distance in kilometers
    
    return distance
  }
  
  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} - Radians
   */
  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }
  
  /**
   * Get current user location using browser's geolocation API
   * @returns {Promise<{lat: number, lng: number}>} - Promise resolving to coordinates
   */
  export function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        error => {
          let errorMessage
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
            default:
              errorMessage = 'Unknown location error'
          }
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }
  
  /**
   * Get address from coordinates using OpenStreetMap Nominatim API
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string>} - Promise resolving to address string
   */
  export async function getAddressFromCoordinates(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'StudentHousing/1.0'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch address: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      return data.display_name
    } catch (error) {
      console.error('Error getting address from coordinates:', error)
      throw error
    }
  }
  
  /**
   * Get coordinates from address using OpenStreetMap Nominatim API
   * @param {string} address - Address to geocode
   * @returns {Promise<{lat: number, lng: number, address: string}>} - Promise resolving to coordinates and formatted address
   */
  export async function getCoordinatesFromAddress(address) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
        {
          headers: {
            'User-Agent': 'StudentHousing/1.0'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch coordinates: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data || data.length === 0) {
        throw new Error('No results found for this address')
      }
      
      const result = data[0]
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: result.display_name
      }
    } catch (error) {
      console.error('Error getting coordinates from address:', error)
      throw error
    }
  }