const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const model = mongoose.model(
  'Token',
  new Schema({
    accessToken: {
      type: String,
    },
    accessTokenExpiresAt: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
    refreshTokenExpiresAt: {
      type: Date,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  })
);

module.exports = model;
