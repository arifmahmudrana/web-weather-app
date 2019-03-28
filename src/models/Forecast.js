const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fields = {
  summary: {
    type: String,
    required: [true, 'place name is required']
  },
  temperature_high: {
    type: Number,
    required: true
  },
  temperature_low: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  precipitation: {
    type: Number,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  time: {
    type: Date,
    required: true
  }
};
const forecastSchema = new Schema(fields);
forecastSchema.index({ latitude: -1 });
forecastSchema.index({ longitude: -1 });
forecastSchema.index({ time: -1 });

const Forecast = mongoose.modelNames().includes('Forecast')
  ? mongoose.connection.model('Forecast')
  : mongoose.model('Forecast', forecastSchema);

Forecast.on('index', err => {
  if (err) {
    console.error('Forecast index error: %s', err);
  } else {
    console.info('Forecast indexing complete');
  }
});

module.exports = {
  Forecast,
  fields
};
