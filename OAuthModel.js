const tokensModel = require('./models/tokens');
const clientsModel = require('./models/clients');
const usersModel = require('./models/users');

module.exports.getAccessToken = function(accessToken) {
  return tokensModel.findOne({
    accessToken
  }).lean();
};

module.exports.getUser = function(username, password) {
  return usersModel.findOne({
    username,
    password
  }).lean();
};

module.exports.saveToken = function(token, client, user) {
  const accessToken = new tokensModel({
    accessToken: token.accessToken,
    accessTokenExpiresOn: token.accessTokenExpiresOn,
    client,
    clientId: client.clientId,
    refreshToken: token.refreshToken,
    refreshTokenExpiresOn: token.refreshTokenExpiresOn,
    user,
    userId: user._id,
  });
  return new Promise(function(resolve, reject) {
    accessToken.save(function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  }).then(function(saveResult) {
    saveResult = saveResult && typeof saveResult == 'object' ? saveResult.toJSON() : saveResult;

    const data = new Object();
    for (let prop in saveResult) {
      data[prop] = saveResult[prop];
    }

    data.client = data.clientId;
    data.user = data.userId;

    return data;
  });
};
