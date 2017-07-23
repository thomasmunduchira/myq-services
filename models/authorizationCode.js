const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const model = mongoose.model('AuthorizationCode', new Schema({
  code: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}));

module.exports = model;
