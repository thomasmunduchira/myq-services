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
  return res.redirect('/authorize');
});

router.get('/login', (req, res) => {
  return res.redirect('/authorize');
});

router.get('/authorize', (req, res) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;
  if (response_type && client_id && redirect_uri && scope && state) {
    req.session.query = Object.assign({}, req.query);
  } else {
    delete req.session.query;
  }
  return res.render('pages/login', { 
    title: 'Login | MyQ Garage Opener',
    script: 'login.js'
  });
});

router.get('/privacy-policy', (req, res) => {
  return res.render('pages/privacy-policy', { 
    title: 'Privacy Policy | MyQ Garage Opener'
  });
});

router.post('/login', (req, res, next) => {
  let { email, password } = req.body;
  email = email.replace(/\s/g, '');
  const garageDoor = new MyQ(email, password);
  return garageDoor.login()
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
  const garageDoor = new MyQ(user.username, user.password);
  return garageDoor.login()
    .then((result) => {
      if (result.returnCode === 0) {
        res.locals.garageDoor = garageDoor;
        return next();
      } else {
        return res.json(result);
      }
    });
});

router.get('/doors', (req, res) => {
  const { garageDoor } = res.locals;
  return garageDoor.getDoors()
    .then((result) => {
      return res.json(result);
    });
});

router.get('/door/state', (req, res) => {
  const { id } = req.query;
  const { garageDoor } = res.locals;
  return garageDoor.getDoorState(id)
    .then((result) => {
      return res.json(result);
    });
});

router.put('/door/state', (req, res) => {
  const { id, state } = req.body;
  const { garageDoor } = res.locals;
  return garageDoor.setDoorState(id, state)
    .then((result) => {
      return res.json(result);
    });
});

router.put('/doors/state', (req, res) => {
  const { state } = req.body;
  const { garageDoor } = res.locals;
  return garageDoor.getDoors()
    .then((result) => {
      if (result.returnCode !== 0) {
        return result;
      }
      const doors = result.doors;
      return Promise.all(doors.map((door) => {
        return garageDoor.setDoorState(door.id, state);
      }));
    }).then((results) => {
      for (let result of results) {
        if (result.returnCode !== 0) {
          return result;
        }
      }
      const result = {
        returnCode: 0
      };
      return res.json(result);
    });
});

module.exports = router;
