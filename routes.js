const express = require('express');
const path = require('path');
const OAuthServer = require('express-oauth-server');

const OAuthModel = require('./OAuthModel');
const MyQ = require('./liftmaster');

const router = express.Router();

const oauth = new OAuthServer({ 
  model: OAuthModel
});

router.use(express.static(path.join(__dirname, 'public')));

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const garageDoor = new MyQ(email, password);
  garageDoor.login()
    .then((response) => {
      if (response.SecurityToken) {
        res.json({
          success: true,
          token: res.SecurityToken,
          message: "Success!"
        });
      } else {
        res.json({
          success: false,
          message: response.ErrorMessage
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
