const config = {
  db: {
    url: 'DB_URL'
  },
  session: {
    secret: 'SESSION_SECRET'
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    masterKey: 'MASTER_KEY',
    pbkdf2Rounds: 10000,
    pbkdf2KeyLength: 32,
    pbkdf2Digest: 'sha512'
  },
  hashing: {
    saltRounds: 10
  },
  authenticatedRoutes: ['/devices', '/door/state', '/light/state']
};

module.exports = config;
