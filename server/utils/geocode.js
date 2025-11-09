const axios = require('axios');

// Geocode an address to { latitude, longitude }
// Tries Google Geocoding API if GOOGLE_MAPS_API_KEY is set, otherwise falls back to OSM Nominatim
// Returns null if not found.
async function geocodeAddress(address) {
  if (!address || !String(address).trim()) return null;
  const addr = String(address).trim();

  // Try Google first if key is available
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOCODE_API_KEY;
  if (googleKey) {
    try {
      const url = 'https://maps.googleapis.com/maps/api/geocode/json';
      const { data } = await axios.get(url, { params: { address: addr, key: googleKey } });
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const loc = data.results[0].geometry?.location;
        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          return { latitude: loc.lat, longitude: loc.lng, provider: 'google' };
        }
      }
    } catch (e) {
      console.warn('Google geocoding failed:', e.message);
    }
  }

  // Fallback to Nominatim
  try {
    const url = 'https://nominatim.openstreetmap.org/search';
    const { data } = await axios.get(url, {
      params: { q: addr, format: 'json', limit: 1 },
      headers: {
        'User-Agent': 'deloreApp/1.0 (geocoding)'
      }
    });
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        return { latitude: lat, longitude: lon, provider: 'nominatim' };
      }
    }
  } catch (e) {
    console.warn('Nominatim geocoding failed:', e.message);
  }

  return null;
}

module.exports = { geocodeAddress };