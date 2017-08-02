const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const hbs = require('hbs');

const config = require('./config');
const routes = require('./routes');

const app = express();

const env = process.env.NODE_ENV || 'development';

mongoose.connect(config.db.url);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to database!');
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views/partials'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static(path.join(__dirname, 'public')));

const sess = {
  store: new MongoStore({
    mongooseConnection: db
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
  const err = new Error('Not Found!');
  err.status = 404;
  return next(err);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = env === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

app.listen(3000, () => {
  console.log('MyQ site listening on port 3000!');
});
