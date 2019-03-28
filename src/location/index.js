const err = require('../utils/err');

module.exports = async location => {
  if (!location.trim()) {
    throw err('location is empty', 442);
  }
  if (location.includes(';')) {
    throw err('location must not contain the semicolon(;) character', 442);
  }

  const { data } = await require('axios').get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      location.toLowerCase()
    )}.json`,
    {
      params: {
        access_token: process.env.MAPBOX_KEY,
        limit: 1
      }
    }
  );

  if (!data.features.length) {
    throw err('No latitude and longitude found', 404);
  }

  return data;
};
