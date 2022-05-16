const mysql = require('mysql2/promise');
const { mySqlConfig } = require('../config');

module.exports = async (query) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const [data] = await con.execute(query);
    await con.end();

    return data;
  } catch (err) {
    return err;
  }
};
