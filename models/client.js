const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const model = mongoose.model(
  'Client',
  new Schema({
    id: {
      type: String,
    },
    redirectUris: {
      type: [String],
    },
    grants: {
      type: [String],
    },
    secret: {
      type: String,
    },
  })
);

module.exports = model;
