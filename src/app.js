require('dotenv').config();
const mongoose = require('mongoose');
if (process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', true);
}
mongoose.set('useCreateIndex', true);
const express = require('express');
const path = require('path');

const getLocation = require('./location');
const getIP2Location = require('./location/ip2location');
const getWeather = require('./weather');
const { Location } = require('./models/Location');
const { Forecast } = require('./models/Forecast');

const port = process.env.PORT || 3000;
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.locals.showNav = true;
app.locals.location = '';

app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.render('index', { showNav: false });
});

app.get('/search', async (req, res, next) => {
  try {
    if (req.query.term.trim()) {
      const locations = await Location.searchLocation(req.query.term).exec();

      return res.json(locations.map(({ place_name }) => place_name));
    }

    res.json([]);
  } catch (error) {
    return next(error);
  }
});

app.get('/weather', async (req, res, next) => {
  // Delete forecasts before date

  const locationModelData = {};
  try {
    let lat,
      lng,
      add,
      locationFound = false;
    if (req.query.location) {
      const locationData = await Location.searchLocation(
        req.query.location,
        1,
        1
      ).exec();
      if (locationData.length) {
        lat = locationData[0].latitude;
        lng = locationData[0].longitude;
        add = locationData[0].place_name;
        locationModelData.place_name = locationData[0].place_name;
        locationFound = true;
      } else {
        const locationData = await getLocation(req.query.location);
        lat = locationData.features[0].center[1];
        lng = locationData.features[0].center[0];
        add = locationData.features[0].place_name;
        locationModelData.place_name = add;
      }
    } else {
      let ip = '';
      if (process.env.NODE_ENV === 'production') {
        ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      }

      let locationRow;
      if (ip) {
        locationRow = await Location.findOne({ ip }).exec();
        if (locationRow) {
          locationModelData.ip = locationRow.ip;
          lat = locationRow.latitude;
          lng = locationRow.longitude;
          add = locationRow.place_name;
          locationFound = true;
        }
      }

      if (!locationRow) {
        const locationData = await getIP2Location(ip);
        locationModelData.ip = locationData.ip;
        lat = locationData.latitude;
        lng = locationData.longitude;
        add = `${locationData.city}, ${locationData.country_name}`;

        locationRow = await Location.findOne({ ip: locationData.ip }).exec();
        if (locationRow) {
          locationFound = true;
        }
      }

      locationModelData.place_name = add;
    }

    locationModelData.latitude = lat;
    locationModelData.longitude = lng;
    if (!locationFound) {
      await new Location(locationModelData).save();
    }

    const end = new Date();
    const start = new Date(end.getTime());
    start.setDate(start.getDate() - 1);
    const forecast = await Forecast.findOne({
      latitude: lat,
      longitude: lng,
      time: { $gte: start, $lte: end }
    }).exec();

    const forecastData = [];
    if (forecast) {
      forecastData.push({
        summary: forecast.summary,
        temperature_high: forecast.temperature_high,
        temperature_low: forecast.temperature_low,
        humidity: forecast.humidity,
        precipitation: forecast.precipitation
      });
    } else {
      const weatherData = await getWeather(lat, lng);
      weatherData.daily.data.forEach(d => {
        let {
          summary,
          temperatureHigh: temperature_high,
          temperatureLow: temperature_low,
          humidity,
          precipProbability: precipitation,
          time
        } = d;

        humidity = parseInt(humidity * 100);
        precipitation = parseInt(precipitation * 100);

        forecastData.push({
          summary,
          temperature_high,
          temperature_low,
          humidity,
          precipitation,
          latitude: lat,
          longitude: lng,
          time: time * 1000
        });
      });
      await Forecast.insertMany(forecastData);
    }

    res.render('weather', {
      location: add,
      ...forecastData[0],
      temperatureHigh: forecastData[0].temperature_high,
      temperatureLow: forecastData[0].temperature_low
    });
  } catch (error) {
    return next(error);
  }
});

app.use((req, res, next) => {
  next(require('./utils/err')('Not Found', 404));
});

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('====================================');
    console.log(err);
    console.log('====================================');
  }
  err.status = err.status || 500;
  res.status(err.status);
  res.render('error', { err, location: req.query.location });
});

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    if (!module.parent) {
      const server = app.listen(port, () => {
        const addr = server.address();
        const bind =
          typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
        console.log('Listening on ' + bind);
      });
    }
  })
  .catch(err => {
    throw err;
  });

module.exports = app;
