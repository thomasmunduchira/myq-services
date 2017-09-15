const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const config = require('./config');
const routes = require('./routes');

const app = express();

const env = process.env.NODE_ENV || 'development';

mongoose.Promise = global.Promise;
mongoose.connect(config.db.url);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to database!');
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(express.static(path.join(__dirname, 'client/build')));

const sess = {
  store: new MongoStore({
    mongooseConnection: db,
  }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {},
};
if (env === 'production') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
}
app.use(session(sess));

app.use('/', routes);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

app.use((err, req, res, next) => {
  if (err.message === 'requestFinalized') {
    return;
  }

  console.error(err.status, err);

  res.locals.message = err.message;
  res.locals.error = env === 'development' ? err : {};

  res.status(err.status || 500);
  if (err.status === 404) {
    return res.render('error', {
      title: '404 | MyQ Home',
      stylesheets: ['error.css'],
      scripts: [],
    });
  }
  return res.json({
    success: false,
    message: 'Something unexpected happened. Please wait a bit and try again.',
  });
});

app.listen(8080, () => {
  console.log('MyQ site listening on port 8080!');
});
