const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const model = mongoose.model('Users', new Schema({
  email: {
    type: String,
    default: ''
  },
  username: {
    type: String
  },
  password: {
    type: String
  },
  securityToken: {
    type: String
  }
}));

module.exports = model;
