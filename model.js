const AuthorizationCode = require('./models/authorizationCode');
const Token = require('./models/token');
const Client = require('./models/client');
const User = require('./models/user');

module.exports.getAccessToken = (accessToken) => {
  console.log('getAccessToken', accessToken);
  return Token.findOne({
      accessToken
    }).populate('client')
    .populate('user')
    .lean()
    .catch((err) => {
      console.log('getAccessToken - Error: ', err);
    });
}

module.exports.getAuthorizationCode = (code) => {
  console.log('getAuthorizationCode', code);
  return AuthorizationCode.findOne({
      code
    }).populate('client')
    .populate('user')
    .lean()
    .catch((err) => {
      console.log('getAuthorizationCode - Error: ', err);
    });
}

module.exports.getClient = (id, secret) => {
  console.log('getClient', id, secret);
  const query = {
    id
  };
  if (secret) {
    query.secret = secret;
  }
  return Client.findOne(query)
    .lean()
    .catch((err) => {
      console.log('getClient - Error: ', err);
    });
};

module.exports.getUser = (username, password) => {
  console.log('getUser', username, password);
  return User.findOne({
      username,
      password
    }).lean()
    .catch((err) => {
      console.log('getUser - Error: ', err);
    });
};

module.exports.saveToken = (token, client, user) => {
  console.log('saveToken', token, client, user);
  const newToken = new Token({
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    client: client._id,
    user: user._id
  });
  return newToken.save()
    .then((saveResult) => {
      console.log(saveResult);
      var data = {};
      for (let prop in token) {
        data[prop] = token[prop];
      }
      data.client = {};
      for (let prop in client) {
        data.client[prop] = client[prop];
      }
      data.user = {};
      for (let prop in user) {
        data.user[prop] = user[prop];
      }
      return data;
    }).catch((err) => {
      console.log('saveToken - Error: ', err);
    });
};

module.exports.saveAuthorizationCode = (code, client, user) => {
  console.log('saveAuthorizationCode', code);
  const newAuthorizationCode = new AuthorizationCode({
    code: code.authorizationCode,
    expiresAt: code.expiresAt,
    client: client._id,
    user: user._id,
  });
  return newAuthorizationCode.save()
    .then((saveResult) => {
      var data = {};
      for (let prop in code) {
        data[prop] = code[prop];
      }
      data.client = {};
      for (let prop in client) {
        data.client[prop] = client[prop];
      }
      data.user = {};
      for (let prop in user) {
        data.user[prop] = user[prop];
      }
      return data;
    }).catch((err) => {
      console.log('saveAuthorizationCode - Error: ', err);
    });
};

module.exports.revokeAuthorizationCode = (code) => {
  console.log('revokeAuthorizationCode', code);
  return AuthorizationCode.findOneAndRemove({
      code: code.code
    }).then((removeResult) => {
      return !!removeResult;
    }).catch((err) => {
      console.log('revokeAuthorizationCode - Error: ', err);
    });
}
