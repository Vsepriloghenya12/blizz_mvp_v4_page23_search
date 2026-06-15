const path = require('path');

const env = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  dataFile: process.env.DATA_FILE || path.join(__dirname, '..', '..', 'data', 'db.json')
};

module.exports = { env };
