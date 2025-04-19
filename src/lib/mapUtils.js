// src/lib/mapUtils.js
/**
 * Utility functions for map-related operations
 */

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Earth's radius in kilometers
    const R = 6371
    
    // Convert degrees to radians
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    
    // Haversine formula
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    
    return distance
  }
  
  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} Radians
   */
  export const deg2rad = (deg) => {
    return deg * (Math.PI/180)
  }
  
  /**
   * Format an address to a more readable format
   * @param {string} address - Full address from geocoding
   * @returns {string} Formatted address
   */
  export const formatAddress = (address) => {
    if (!address) return ''
    
    // Split by commas and remove extra spaces
    const parts = address.split(',').map(part => part.trim())
    
    // If it's a short address, return as is
    if (parts.length <= 3) return address
    
    // For longer addresses, format them more nicely
    // Usually the last parts are country, state/province, etc.
    const city = parts[parts.length - 3] || ''
    const state = parts[parts.length - 2] || ''
    const country = parts[parts.length - 1] || ''
    
    const specificLocation = parts.slice(0, parts.length - 3).join(', ')
    
    return `${specificLocation}, ${city}, ${state}, ${country}`
  }
  
  /**
   * Get address from coordinates using Nominatim API (OpenStreetMap)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string>} Address string
   */
  export const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
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
   * Get coordinates from address using Nominatim API (OpenStreetMap)
   * @param {string} address - Address to geocode
   * @returns {Promise<{lat: number, lng: number, display_name: string}>} Coordinates and display name
   */
  export const getCoordinatesFromAddress = async (address) => {
    try {
      const encodedAddress = encodeURIComponent(address)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`)
      const data = await response.json()
      
      if (!data || data.length === 0) {
        throw new Error('No results found')
      }
      
      const result = data[0]
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name
      }
    } catch (error) {
      console.error('Error getting coordinates from address:', error)
      throw error
    }
  }
  
  /**
   * Check if browser supports geolocation
   * @returns {boolean} True if geolocation is supported
   */
  export const isGeolocationSupported = () => {
    return 'geolocation' in navigator
  }
  
  /**
   * Get current position as a Promise
   * @returns {Promise<{lat: number, lng: number}>} Coordinates
   */
  export const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!isGeolocationSupported()) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          reject(error)
        }
      )
    })
  }