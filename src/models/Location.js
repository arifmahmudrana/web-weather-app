const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fields = {
  place_name: {
    type: String,
    required: [true, 'place name is required']
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  ip: {
    type: String,
    default: null
  }
};
const locationSchema = new Schema(fields);
locationSchema.index({ place_name: 'text' });
locationSchema.index({ ip: -1 });

locationSchema.statics.searchLocation = function(
  location,
  limit = 10,
  textScore = 0
) {
  return this.aggregate([
    {
      $match: {
        $text: {
          $search: location
        }
      }
    },
    {
      $addFields: {
        score: {
          $meta: 'textScore'
        }
      }
    },
    {
      $match: {
        score: { $gt: textScore }
      }
    },
    {
      $sort: {
        score: -1,
        _id: -1
      }
    },
    {
      $limit: limit
    }
  ]);
};

const Location = mongoose.modelNames().includes('Location')
  ? mongoose.connection.model('Location')
  : mongoose.model('Location', locationSchema);

Location.on('index', err => {
  if (err) {
    console.error('Location index error: %s', err);
  } else {
    console.info('Location indexing complete');
  }
});

module.exports = {
  Location,
  fields
};
