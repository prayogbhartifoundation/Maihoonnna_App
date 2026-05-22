const express = require('express');
const router = express.Router();
const ApiError = require('../utils/ApiError');


// GET /api/location/config
// Returns the Google Maps API key to the authenticated frontend
router.get('/config', (req, res, next) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new ApiError(500, 'Google Maps API key is not configured on the server');
    }
    
    res.json({
      success: true,
      data: {
        apiKey: apiKey
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/location/geocode
// Converts an address string into lat/long coordinates using Google Geocoding API
router.get('/geocode', async (req, res, next) => {
  try {
    const { address } = req.query;
    if (!address) {
      throw new ApiError(400, 'Address is required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new ApiError(500, 'Google Maps API key is not configured on the server');
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new ApiError(500, `Geocoding failed: ${data.status} - ${data.error_message || ''}`);
    }

    const location = data.results[0].geometry.location;

    res.json({
      success: true,
      data: {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/location/reverse-geocode
// Converts lat/long coordinates into a human-readable address
router.get('/reverse-geocode', async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      throw new ApiError(400, 'Latitude and Longitude are required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new ApiError(500, 'Google Maps API key is not configured on the server');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new ApiError(500, `Reverse geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const components = result.address_components;
    
    let city = '';
    let state = '';
    let pincode = '';
    
    components.forEach(c => {
      if (c.types.includes('locality')) city = c.long_name;
      if (c.types.includes('administrative_area_level_1')) state = c.long_name;
      if (c.types.includes('postal_code')) pincode = c.long_name;
      // Fallback for city if locality is not present
      if (!city && c.types.includes('administrative_area_level_2')) city = c.long_name;
    });

    res.json({
      success: true,
      data: {
        fullAddress: result.formatted_address,
        city,
        state,
        pincode,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
