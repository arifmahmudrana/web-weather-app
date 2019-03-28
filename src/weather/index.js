const err = require('../utils/err');

module.exports = async (lat, lng) => {
  const { data } = await require('axios').get(
    `https://api.darksky.net/forecast/${process.env.DARKSKY_KEY}/${lat},${lng}`,
    {
      params: {
        exclude: 'minutely,hourly,currently,alerts,flags',
        units: 'si'
      }
    }
  );

  if (!data.daily || !data.daily.data.length) {
    throw err('No weather update found', 404);
  }

  return data;
};
