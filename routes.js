const express = require('express');
const path = require('path');
const OAuthServer = require('express-oauth-server');
const MyQ = require('liftmaster-api');

const config = require('./config');
const OAuthModel = require('./OAuthModel');

const router = express.Router();

const oauth = new OAuthServer({ 
  model: OAuthModel
});

router.use(express.static(path.join(__dirname, 'public')));

router.get('/login', (req, res) => {
  const { state, client_id } = req.query;
  if (client_id === config.client_id) {
    res.redirect(`/?state=${state}`);
  }
});

router.post('/login', (req, res, next) => {
  const { email, password, state } = req.body;
  if (!state) {
    return next();
  }
  const garageDoor = new MyQ(email, password);
  garageDoor.login()
    .then((result) => {
      if (result.returnCode === 0) {
        res.redirect(`${config.redirect_uri}/?state=${state}&code=${code}`);
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

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const garageDoor = new MyQ(email, password);
  garageDoor.login()
    .then((result) => {
      if (result.returnCode === 0) {
        res.json({
          success: true,
          message: "Logged in!"
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

router.use(oauth.token());
router.use(oauth.authorize());
router.use(oauth.authenticate());

module.exports = router;
