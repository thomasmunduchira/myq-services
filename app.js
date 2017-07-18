const express = require('express');
const app = express();
const logger = require('morgan');
const bodyParser = require('body-parser');

app.use(logger('dev'));
app.use(bodyParser.json());

const routes = require('./routes');
app.use('/', routes);

app.listen(3000, function() {
  console.log('LiftMaster API listening on port 3000!');
});
