const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const OAuthServer = require('oauth2-server');
const AccessDeniedError = require('oauth2-server/lib/errors/access-denied-error');

const Request = OAuthServer.Request;
const Response = OAuthServer.Response;
const MyQ = require('./myq-api/myq');
const config = require('./config');
const model = require('./model');
// const Token = require('./models/token');
// const Client = require('./models/client');
const User = require('./models/user');

const router = express.Router();

const oauth = new OAuthServer({
  model,
});

const encrypt = text => {
  const { algorithm, masterKey, pbkdf2Rounds, pbkdf2KeyLength, pbkdf2Digest } = config.encryption;
  try {
    const iv = crypto.randomBytes(12);
    const salt = crypto.randomBytes(64);
    const key = crypto.pbkdf2Sync(masterKey, salt, pbkdf2Rounds, pbkdf2KeyLength, pbkdf2Digest);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  } catch (err) {
    console.error(err);
  }
};

const decrypt = encrypted => {
  const { algorithm, masterKey, pbkdf2Rounds, pbkdf2KeyLength, pbkdf2Digest } = config.encryption;
  try {
    const data = new Buffer(encrypted, 'base64');
    const salt = data.slice(0, 64);
    const iv = data.slice(64, 76);
    const tag = data.slice(76, 92);
    const text = data.slice(92);
    const key = crypto.pbkdf2Sync(masterKey, salt, pbkdf2Rounds, pbkdf2KeyLength, pbkdf2Digest);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');
  } catch (err) {
    console.error(err);
  }
};

const validateEmail = email => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

router.post('/login', (req, res, next) => {
  let { email, password } = req.body;
  if (!email || !password || !validateEmail(email)) {
    return res.json({
      success: false,
      message: 'Email and/or password are incorrect.',
    });
  }
  email = email.replace(/\s/g, '').toLowerCase();
  const account = new MyQ(email, password);
  return account
    .login()
    .then(result => {
      if (result.returnCode !== 0) {
        res.json({
          success: false,
          message: result.error,
        });
        throw new Error('requestFinalized');
      }
      req.session.user = {
        username: email,
        password: encrypt(password),
        securityToken: result.token,
      };
      return User.findOne({
        username: email,
      });
    })
    .then(findResult => {
      if (!findResult) {
        const newUser = new User(req.session.user);
        return newUser.save();
      }
      findResult.password = req.session.user.password;
      findResult.securityToken = req.session.user.securityToken;
      return findResult.save();
    })
    .then(() => {
      const query = req.session.query || {};
      const { pin, response_type, client_id, redirect_uri, scope, state } = query;
      if (pin === 'true' || !response_type || !client_id || !redirect_uri || !scope || !state) {
        res.json({
          success: true,
          message: 'Logged in!',
        });
        throw new Error('requestFinalized');
      }
      req.query = req.session.query;
      req.url = '/oauth/authorize';
      return next();
    })
    .catch(err => {
      next(err);
    });
});

router.post('/pin', (req, res, next) => {
  let { enablePin, pin } = req.body;
  const { username, password, securityToken } = req.session.user;
  const query = req.session.query || {};
  const { response_type, client_id, redirect_uri, scope, state } = query;
  if (!username || !password || !securityToken) {
    return res.json({
      success: false,
      message: 'Error: not authenticated',
    });
  } else if (enablePin) {
    if (!pin) {
      return res.json({
        success: false,
        message: 'Error: no pin provided',
      });
    } else if (!Number.isInteger(pin)) {
      return res.json({
        success: false,
        message: 'Error: pin must be an integer',
      });
    } else if (pin < 0) {
      return res.json({
        success: false,
        message: 'Error: Pin must be positive',
      });
    }

    pin = pin.toString();
    if (pin.length < 4 || pin.length > 12) {
      return res.json({
        success: false,
        message: 'Error: Pin must be 4 to 12 digits in length',
      });
    }
  }

  const data = {};
  return User.findOne({
    username,
  })
    .then(findResult => {
      if (!findResult) {
        res.json({
          success: false,
          message: 'Error: user does not exist',
        });
        throw new Error('requestFinalized');
      }
      data.findResult = findResult;

      if (!enablePin) {
        return;
      }
      return bcrypt.hash(pin, config.hashing.saltRounds);
    })
    .then(hash => {
      if (enablePin) {
        data.findResult.pin = hash;
        data.findResult.pinReset = false;
      } else {
        data.findResult.pin = undefined;
      }
      return data.findResult.save();
    })
    .then(saveResult => {
      if (!response_type || !client_id || !redirect_uri || !scope || !state) {
        res.json({
          success: true,
          message: 'Pin saved!',
        });
        throw new Error('requestFinalized');
      }
      req.query = req.session.query;
      req.url = '/oauth/authorize';
      return next();
    })
    .catch(err => {
      next(err);
    });
});

const handleResponse = (req, res, response) => {
  if (response.status !== 302) {
    res.set(response.headers);
    res.status(response.status);
    return res.send(response.body);
  }
  const location = response.headers.location;
  delete response.headers.location;
  res.set(response.headers);
  return res.redirect(location);
};

const handleError = (err, res, next) => {
  if (err instanceof AccessDeniedError) {
    return res.send();
  }
  return next(err);
};

const authenticateHandler = {
  handle: (request, response) => {
    const { username, password } = request.session.user;
    return User.findOne({
      username,
      password,
    })
      .lean()
      .catch(err => next(err));
  },
};

router.post('/oauth/authorize', (req, res, next) => {
  const request = new Request(req);
  const response = new Response(res);

  return oauth
    .authorize(request, response, {
      authenticateHandler,
    })
    .then(code => {
      res.locals.oauth = {
        code,
      };
      req.session.destroy(err => {
        if (err) {
          console.error(err);
        }
        const location = response.headers.location;
        delete response.headers.location;
        return res.json({
          success: true,
          message: 'Logged in! Redirecting you to the confirmation page.',
          redirectUri: location,
        });
      });
    })
    .catch(err => handleError(err, res, next));
});

router.post('/oauth/token', (req, res, next) => {
  const request = new Request(req);
  const response = new Response(res);

  return oauth
    .token(request, response)
    .then(token => {
      res.locals.oauth = {
        token,
      };
      return handleResponse(req, res, response);
    })
    .catch(err => handleError(err, res, next));
});

router.use(config.authenticatedRoutes, (req, res, next) => {
  const request = new Request(req);
  const response = new Response(res);

  return oauth
    .authenticate(request, response)
    .then(token => {
      res.locals.oauth = {
        token,
      };
      return next();
    })
    .catch(err => handleError(err, res, next));
});

router.post('/resetPin', (req, res, next) => {
  const { user } = res.locals.oauth.token;
  const { username } = user;

  return User.findOne({
    username,
  })
    .then(findResult => {
      if (!findResult) {
        res.json({
          success: false,
          message: 'Error: user does not exist',
        });
        throw new Error('requestFinalized');
      }
      findResult.pin = undefined;
      findResult.pinReset = true;
      return findResult.save();
    })
    .then(saveResult => {
      console.log('SAVE ', saveResult);
      return res.json({
        success: true,
      });
    })
    .catch(err => {
      next(err);
    });
});

router.use(config.authenticatedRoutes, (req, res, next) => {
  const { user } = res.locals.oauth.token;
  const account = new MyQ(user.username, decrypt(user.password));
  return account.login().then(result => {
    if (result.returnCode === 0) {
      console.log('Authenticate success');
      res.locals.account = account;
      return next();
    }
    console.log('Authenticate failure');
    return res.json(result);
  });
});

router.get('/devices', (req, res, next) => {
  const { account } = res.locals;
  const typeIds = [2, 3, 5, 7, 17];
  return account
    .getDevices(typeIds)
    .then(result => {
      console.log('GET /devices:', result);
      res.locals.result = result;
      return next();
    })
    .catch(err => next(err));
});

router.get('/door/state', (req, res, next) => {
  const { id } = req.query;
  const { account } = res.locals;
  return account
    .getDoorState(id)
    .then(result => {
      console.log('GET /door/state:', result);
      res.locals.result = result;
      return next();
    })
    .catch(err => next(err));
});

const setDoorState = (req, res, next) => {
  const { id, state } = req.body;
  const { account } = res.locals;

  return account
    .setDoorState(id, state)
    .then(result => {
      console.log('PUT /door/state:', result);
      res.locals.result = result;
      return next();
    })
    .catch(err => next(err));
};

router.put('/door/state', (req, res, next) => {
  let { state, pin } = req.body;
  const { oauth } = res.locals;
  const { user } = oauth.token;

  if (state === 1) {
    let result;
    if (user.pinReset) {
      result = {
        returnCode: 23,
        error: 'Error: pin reset',
      };
    } else if (!user.pin) {
      result = {
        returnCode: 20,
        error: 'Error: no pin saved',
      };
    } else if (!pin) {
      result = {
        returnCode: 21,
        error: 'Error: no pin provided',
      };
    } else if (!Number.isInteger(pin) || pin < 0) {
      result = {
        returnCode: 22,
        error: 'Error: invalid pin',
      };
    }

    if (result) {
      console.log('PUT /door/state:', result);
      res.locals.result = result;
      return next();
    }

    pin = pin.toString();

    return bcrypt
      .compare(pin, user.pin)
      .then(response => {
        if (!response) {
          result = {
            returnCode: 22,
            error: 'Error: invalid pin',
          };
          console.log('PUT /door/state:', result);
          res.locals.result = result;
          return next();
        }
        return setDoorState(req, res, next);
      })
      .catch(err => next(err));
  }
  return setDoorState(req, res, next).catch(err => next(err));
});

router.get('/light/state', (req, res, next) => {
  const { id } = req.query;
  const { account } = res.locals;
  return account
    .setLightState(id)
    .then(result => {
      console.log('GET /light/state:', result);
      res.locals.result = result;
      return next();
    })
    .catch(err => next(err));
});

router.put('/light/state', (req, res, next) => {
  const { id, state } = req.body;
  const { account } = res.locals;
  return account
    .setLightState(id, state)
    .then(result => {
      console.log('PUT /light/state:', result);
      res.locals.result = result;
      return next();
    })
    .catch(err => next(err));
});

router.use(config.authenticatedRoutes, (req, res) => {
  const { result } = res.locals;
  const { user } = res.locals.oauth.token;

  result.email = user.username;
  return res.json(result);
});

router.get('/feedback', (req, res, next) => res.redirect('https://goo.gl/forms/0QqC5ez2uMaqn5LT2'));

router.get('/authorize', (req, res, next) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;
  if (response_type && client_id && redirect_uri && scope && state) {
    req.session.query = req.query;
  } else {
    delete req.session.query;
  }
  return res.redirect('/login');
});

router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

module.exports = router;
