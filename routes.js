const express = require('express');
const path = require('path');
const OAuthServer = require('express-oauth-server');
const MyQ = require('./liftmaster-api/liftmaster');

const config = require('./config');
const model = require('./model');
const Token = require('./models/token');
const Client = require('./models/client');
const User = require('./models/user');

const router = express.Router();

const oauth = new OAuthServer({ 
  model,
  useErrorHandler: true
});

router.use(express.static(path.join(__dirname, 'public')));

router.get('/login', (req, res) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;
  req.session.response_type = response_type;  
  req.session.client_id = client_id;
  req.session.redirect_uri = redirect_uri;
  req.session.scope = scope;
  req.session.state = state;
  res.redirect('/');
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
              res.json({
                success: true,
                message: "Logged in!"
              });
            }
          }).catch((err) => {
            console.log(err);
          });
      } else {
        res.json({
          success: false,
          message: result.error
        });
      }
    }).catch((err) => {
      console.log(err);
    });
});

const authenticateHandler = {
  handle: (request, response) => {
    return request.session.user;
  }
};

router.post('/oauth/authorize', oauth.authorize({
  authenticateHandler
}));
router.use(oauth.token());
router.use(oauth.authenticate());

module.exports = router;
