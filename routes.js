const express = require('express');
const path = require('path');
const OAuthServer = require('oauth2-server');
const AccessDeniedError = require('oauth2-server/lib/errors/access-denied-error');
const Request = OAuthServer.Request;
const Response = OAuthServer.Response;
const MyQ = require('./node-liftmaster/liftmaster');

const config = require('./config');
const model = require('./model');
const Token = require('./models/token');
const Client = require('./models/client');
const User = require('./models/user');

const router = express.Router();

const oauth = new OAuthServer({ 
  model
});

router.get('/authorize', (req, res, next) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;
  req.session.response_type = response_type;
  req.session.client_id = client_id;
  req.session.redirect_uri = redirect_uri;
  req.session.scope = scope;
  req.session.state = state;
  res.redirect('/login');
});

router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('pages/login', { 
    title: 'Login | Garage Opener',
    script: 'login.js'
  });
});

router.get('/privacy-policy', (req, res) => {
  res.render('pages/privacy-policy', { 
    title: 'Privacy Policy | Garage Opener'
  });
});

router.post('/login', (req, res, next) => {
  const { email, password } = req.body;
  const garageDoor = new MyQ(email, password);
  garageDoor.login()
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
            if (req.session.response_type === 'code') {
              const { response_type, client_id, redirect_uri, scope, state } = req.session;
              req.query.response_type = response_type;  
              req.query.client_id = client_id;
              req.query.redirect_uri = redirect_uri;
              req.query.scope = scope;
              req.query.state = state;
              req.url = '/oauth/authorize';
              return next();
            } else {
              return res.json({
                success: true,
                message: "Logged in!"
              });
            }
          }).catch((err) => {
            console.log(err);
          });
      } else {
        return res.json({
          success: false,
          message: result.error
        });
      }
    }).catch((err) => {
      console.log(err);
    });
});

const handleResponse = (req, res, response) => {
  if (response.status === 302) {
    const location = response.headers.location;
    delete response.headers.location;
    res.set(response.headers)
      .redirect(location);
  } else {
    res.set(response.headers);
    res.status(response.status)
      .send(response.body);
  }
};

const handleError = (error, res, next) => {
  console.log(error);
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
        console.log('Error: ', err);
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
      return;
    }).then(() => {
      const location = response.headers.location;
      delete response.headers.location;
      return res.json({
        success: true,
        message: "Logged in!",
        redirectUri: location
      });
    })
    .catch((error) => {
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
      return;
    }).then(() => {
      return handleResponse(req, res, response);
    }).catch(function(error) {
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
  const user = res.locals.oauth.user;
  const garageDoor = new MyQ(user.username, user.password);
  garageDoor.login()
    .then((result) => {
      if (result.returnCode === 0) {
        req.locals.garageDoor = garageDoor;
        return next();
      } else {
        return res.json(result);
      }
    });
});

router.get('/doors', (req, res) => {
  const { garageDoor } = req.locals;
  return garageDoor.getDoors()
    .then((result) => {
      return res.json(result);
    });
});

router.get('/door/state', (req, res) => {
  const { id } = req.params;
  const { garageDoor } = req.locals;
  return garageDoor.getDoorState(doorId)
    .then((result) => {
      return res.json(result);
    });
});

router.put('/door/state', (req, res) => {
  const { id, state } = req.body;
  const { garageDoor } = req.locals;
  return garageDoor.setDoorState(id, state)
    .then((result) => {
      return res.json(result);
    });
});

router.put('/doors/state', (req, res) => {
  const { state } = req.body;
  const { garageDoor } = req.locals;
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
      for (let result in results) {
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
