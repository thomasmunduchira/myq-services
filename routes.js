const express = require('express');
const router = express.Router();

router.get('/authenticate', (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
});
