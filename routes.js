const express = require('express');
const router = express.Router();
const OAuthServer = require('express-oauth-server');

const OAuthModel = require('./OAuthModel');

const oauth = new OAuthServer({ 
  model: OAuthModel
});

router.get('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
});

router.use(oauth.token());
router.use(oauth.authorize());
router.use(oauth.authenticate());

module.exports = router;
