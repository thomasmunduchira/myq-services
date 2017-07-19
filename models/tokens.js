const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const model = mongoose.model('Tokens', new Schema({
  accessToken: {
    type: String
  },
  accessTokenExpiresOn: {
    type: Date
  },
  client: {
    type: Object
  },
  clientId: {
    type: String
  },
  refreshToken: {
    type: String
  },
  refreshTokenExpiresOn: {
    type: Date
  },
  user: {
    type: Object
  },
  userId: {
    type: String
  },
}));

module.exports = model;
