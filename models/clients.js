const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const model = mongoose.model('Clients', new Schema({
  clientId: {
    type: String
  },
  clientSecret: {
    type: String
  },
  redirectUris: {
    type: Array
  }
}));

module.exports = model;
