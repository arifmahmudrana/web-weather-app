const err = require('../utils/err');

module.exports = async (ip = '') => {
  console.log('==================ip==================');
  console.log(ip);
  console.log('==================ip==================');
  const { data } = await require('axios').get(`https://api.ipdata.co/${ip}`, {
    params: {
      'api-key': process.env.IPDATA_KEY,
      limit: 1
    }
  });

  const { latitude, longitude } = data;
  if (!latitude || !longitude) {
    throw err('No latitude and longitude found', 404);
  }

  return data;
};
