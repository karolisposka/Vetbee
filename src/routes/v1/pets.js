const express = require('express');
const fetch = require('node-fetch');
const mysql = require('mysql2/promise');
const loggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mySqlConfig, mailServer, mailServerPassword } = require('../../config');
const { petRegistration } = require('../../middleware/validationSchemas/petVerification');

const router = express.Router();

router.get('/', loggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const [data] = await con.execute('SELECT * FROM pets');
    await con.end();

    return res.send(data);
  } catch (err) {
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/', loggedIn, validation(petRegistration), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const [data] = await con.execute(`
        INSERT INTO pets (name, owner_email)
        VALUES (${mysql.escape(req.body.name)}, ${mysql.escape(req.body.ownerEmail)})
    `);
    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ msg: 'something wrong with server, please try again later' });
    }

    const response = await fetch(mailServer, {
      method: 'POST',
      body: JSON.stringify({
        password: mailServerPassword,
        email: req.body.ownerEmail,
        message: `A pet, ${req.body.name}, under your email has been added to VetBee`,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await response.json();

    if (!json.info) {
      return res.status(500).send({ msg: 'something wrong with server, please try again later' });
    }

    return res.send({ msg: 'Successfully added a pet' });
  } catch (err) {
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

module.exports = router;
