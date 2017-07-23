const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const config = require('./config');
const routes = require('./routes');

const app = express();

mongoose.connect(config.db.url);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to database!');
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

const sess = {
  store: new MongoStore({
    mongooseConnection: db
  }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {},
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
}

app.use(session(sess));

app.use('/', routes);

app.listen(3000, function() {
  console.log('LiftMaster API listening on port 3000!');
});
