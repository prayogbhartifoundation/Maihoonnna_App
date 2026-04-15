const express = require('express');
const router = express.Router();

/**
 * @route GET /api/pincode/:pincode
 * @desc Proxy for the Indian Postal Pincode API
 */
router.get('/:pincode', async (req, res) => {
  const { pincode } = req.params;

  if (!pincode || pincode.length !== 6) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid pincode format' });
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`
    );
    const data = await response.json();

    // The API returns an array (usually with one element).
    // Each element has a 'Status' and 'PostOffice' (array of objects).
    if (data[0].Status === 'Success') {
      return res.json({
        success: true,
        data: data[0].PostOffice, // Return all post offices so frontend can show selection if needed
        message: 'Pincode data found',
      });
    } else {
      return res.status(404).json({
        success: false,
        message: data[0].Message || 'No data found for this pincode',
      });
    }
  } catch (error) {
    console.error('Pincode fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching pincode data',
    });
  }
});

module.exports = router;
