const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const model = mongoose.model('User', new Schema({
  username: {
    type: String
  },
  password: {
    type: String
  },
  securityToken: {
    type: String
  },
  pin: {
    type: String
  }
}));

module.exports = model;
