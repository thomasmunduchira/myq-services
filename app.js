const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const greenlockExpress = require('greenlock-express');
const leChallengeFs = require('le-challenge-fs');
const leStoreCertbot = require('le-store-certbot');
const http = require('http');
const https = require('https');
const redirectHttps = require('redirect-https');

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
if (env === 'production') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
}
app.use(session(sess));

app.use('/', routes);

const approveDomains = (opts, certs, cb) => {
  if (certs) {
    opts.domains = certs.altnames;
  } else {
    opts.email = config.email;
    opts.agreeTos = true;
  }
  cb(null, {
    options: opts,
    certs: certs
  });
}
 
const lex = greenlockExpress.create({
  server: 'staging',
  challenges: {
    'http-01': leChallengeFs.create({
      webrootPath: '/tmp/acme-challenges'
    })
  },
  store: leStoreCertbot.create({
    webrootPath: '/tmp/acme-challenges'
  }), 
  approveDomains: approveDomains
});

if (env === 'production') {
  http.createServer(lex.middleware(redirectHttps)())
    .listen(80, () => {
      console.log('LiftMaster API listening on', this.address());
    });
 
  https.createServer(lex.httpsOptions, lex.middleware(app))
    .listen(443, () => {
      console.log('LiftMaster API listening on', this.address());
    });
} else {
  app.listen(3000, () => {
    console.log('LiftMaster API listening on port 3000!');
  });
}
