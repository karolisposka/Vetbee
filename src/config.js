require('dotenv').config();

module.exports = {
  jwtToken: process.env.JWT_CODE,
  mySqlConfig: {
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    port: process.env.SQL_PORT,
    database: process.env.SQL_DB,
  },
  port: process.env.PORT,
};
