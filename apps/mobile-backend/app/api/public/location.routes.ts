import { Router, Request, Response, NextFunction } from 'express';
import { ApiError } from '../../utils/ApiError';

const router = Router();

router.get('/reverse-geocode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      throw new ApiError(400, 'Latitude and longitude are required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new ApiError(500, 'Google Maps API key is not configured on the server');
    }

    // Using native fetch which is available in Node 18+
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
    const data = await response.json();

    if (data.status !== 'OK') {
       return res.status(400).json({ success: false, message: 'Geocoding failed', details: data });
    }

    // Extract relevant parts
    const result = data.results[0];
    const address = result.formatted_address;
    
    // Extract city, state, pincode from address_components
    let city = '', state = '', pincode = '';
    if (result.address_components) {
      result.address_components.forEach((comp: any) => {
          if (comp.types.includes('locality')) city = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
          if (comp.types.includes('postal_code')) pincode = comp.long_name;
      });
    }

    res.json({
      success: true,
      data: {
        address,
        city,
        state,
        pincode,
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
