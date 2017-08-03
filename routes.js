const express = require('express');
const path = require('path');
const OAuthServer = require('oauth2-server');
const AccessDeniedError = require('oauth2-server/lib/errors/access-denied-error');
const Request = OAuthServer.Request;
const Response = OAuthServer.Response;
const MyQ = require('./myq-api/myq');

const config = require('./config');
const model = require('./model');
const Token = require('./models/token');
const Client = require('./models/client');
const User = require('./models/user');

const router = express.Router();

const oauth = new OAuthServer({ 
  model
});

router.get('/', (req, res) => {
  return res.redirect('/login');
});

router.get('/login', (req, res) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;
  if (response_type && client_id && redirect_uri && scope && state) {
    req.session.query = Object.assign({}, req.query);
  } else {
    delete req.session.query;
  }
  return res.render('pages/login', { 
    title: 'Login | MyQ Garage Opener',
    stylesheets: ['login.css'],
    scripts: ['login.js']
  });
});

router.get('/privacy-policy', (req, res) => {
  return res.render('pages/privacy-policy', { 
    title: 'Privacy Policy | MyQ Garage Opener',
    stylesheets: ['privacy-policy.css'],
    scripts: []
  });
});

router.post('/login', (req, res, next) => {
  let { email, password } = req.body;
  if (!email || email === "" || !password || password === "") {
    return res.json({
      success: false,
      message: 'Email and/or password are incorrect.'
    });
  }
  email = email.replace(/\s/g, '').toLowerCase();
  const account = new MyQ(email, password);
  return account.login()
    .then((result) => {
      if (result.returnCode === 0) {
        req.session.user = {
          username: email,
          password,
          securityToken: result.token
        };
        User.findOne({
            username: email
          }).then((findResult) => {
            if (findResult) {
              if (findResult.password !== password || findResult.securityToken !== result.token) {
                findResult.password = password;
                findResult.securityToken = result.token;
                return findResult.save();
              }
            } else {
              const newUser = new User(req.session.user);
              return newUser.save();
            }
          }).then((saveResult) => {
            const query = req.session.query || {};
            const { response_type, client_id, redirect_uri, scope, state } = query;
            if (response_type && client_id && redirect_uri && scope && state) {
              req.query = Object.assign({}, req.session.query);
              req.url = '/oauth/authorize';
              return next();
            } else {
              return res.json({
                success: true,
                message: 'Logged in!'
              });
            }
          }).catch((err) => {
            console.error(err);
            return res.json({
              success: false,
              message: 'Something unexpected happened. Please wait a bit and try again.'
            });
          });
      } else {
        return res.json({
          success: false,
          message: result.error
        });
      }
    }).catch((err) => {
      console.error(err);
      return res.json({
        success: false,
        message: 'Something unexpected happened. Please wait a bit and try again.'
      });
    });
});

const handleResponse = (req, res, response) => {
  if (response.status === 302) {
    const location = response.headers.location;
    delete response.headers.location;
    res.set(response.headers);
    return res.redirect(location);
  } else {
    res.set(response.headers);
    res.status(response.status);
    return res.send(response.body);
  }
};

const handleError = (error, res, next) => {
  console.error(error);
  if (error instanceof AccessDeniedError) {
    return res.send();
  } else {
    return next(error);
  }
};

const authenticateHandler = {
  handle: (request, response) => {
    const { username, password } = request.session.user;
    return User.findOne({
        username,
        password
      }).lean()
      .catch((err) => {
        console.error(err);
        return next(error);
      });
  }
};

router.post('/oauth/authorize', (req, res, next) => {
  const request = new Request(req);
  const response = new Response(res);

  return oauth.authorize(request, response, {
      authenticateHandler
    }).then((code) => {
      res.locals.oauth = {
        code
      };
      const location = response.headers.location;
      delete response.headers.location;
      return res.json({
        success: true,
        message: "Logged in! Redirecting you to the confirmation page.",
        redirectUri: location
      });
    }).catch((error) => {
      return handleError(error, res, next);
    });
});

router.post('/oauth/token', (req, res, next) => {
  const request = new Request(req);
  const response = new Response(res);

  return oauth.token(request, response)
    .then((token) => {
      res.locals.oauth = {
        token
      };
      return handleResponse(req, res, response);
    }).catch((error) => {
      return handleError(error, res, next);
    });
});

router.use((req, res, next) => {
  const request = new Request(req);
  const response = new Response(res);

  return oauth.authenticate(request, response)
    .then((token) => {
      res.locals.oauth = {
        token
      };
      return next();
    }).catch((error) => {
      return handleError(error, res, next);
    });
});

router.use((req, res, next) => {
  const { user } = res.locals.oauth.token;
  const account = new MyQ(user.username, user.password);
  return account.login()
    .then((result) => {
      if (result.returnCode === 0) {
        res.locals.account = account;
        return next();
      } else {
        return res.json(result);
      }
    });
});

router.get('/devices', (req, res) => {
  const { account } = res.locals;
  const typeIds = [2, 3, 5, 7, 17]
  return account.getDevices(typeIds)
    .then((result) => {
      console.log('GET devices:', result);
      return res.json(result);
    });
});

router.get('/door/state', (req, res) => {
  const { id } = req.query;
  const { account } = res.locals;
  return account.getDoorState(id)
    .then((result) => {
      console.log('GET door state:', result);
      return res.json(result);
    });
});

router.put('/door/state', (req, res) => {
  const { id, state } = req.body;
  const { account } = res.locals;
  return account.setDoorState(id, state)
    .then((result) => {
      console.log('PUT door state:', result);
      return res.json(result);
    });
});

router.get('/light/state', (req, res) => {
  const { id } = req.query;
  const { account } = res.locals;
  return account.setLightState(id)
    .then((result) => {
      console.log('GET light state:', result);
      return res.json(result);
    });
});

router.put('/light/state', (req, res) => {
  const { id, state } = req.body;
  const { account } = res.locals;
  return account.setLightState(id, state)
    .then((result) => {
      console.log('PUT light state:', result);
      return res.json(result);
    });
});

module.exports = router;
