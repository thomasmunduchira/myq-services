const config = {
  db: {
    url: DB_URL
  },
  session: {
    secret: SESSION_SECRET
  },
  hashing: {
    saltRounds: SALT_ROUNDS
  },
  email: EMAIL
};

module.exports = config;
