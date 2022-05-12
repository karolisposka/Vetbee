const express = require('express');
const fetch = require('node-fetch');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const validation = require('../../middleware/validation');
const loggedIn = require('../../middleware/auth');
const { mySqlConfig, jwtSecret, mailServer, mailServerPassword } = require('../../config');
const {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resetPassword,
  newPassword,
} = require('../../middleware/validationSchemas/authVerification');

const router = express.Router();

router.post('/login', validation(loginSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const [data] = await con.execute(
      `SELECT id, password FROM users WHERE email=${mysql.escape(req.body.email)} LIMIT 1`,
    );
    await con.end();

    if (data.length !== 1) {
      return res.status(400).send({ msg: 'Incorrect email or password' });
    }

    const checkHash = bcrypt.compareSync(req.body.password, data[0].password);

    if (!checkHash) {
      return res.status(400).send({ msg: 'Incorrect email or password' });
    }

    const token = jsonwebtoken.sign({ id: data[0].id }, jwtSecret);
    return res.send({ msg: 'login successful', token });
  } catch (err) {
    console.log(`${err} pirmas`);
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/register', validation(registerSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const hash = bcrypt.hashSync(req.body.password, 10);
    const [data] = await con.execute(`
    INSERT INTO users (username, password, email)
    VALUES (${mysql.escape(req.body.username)}, ${mysql.escape(hash)}, ${mysql.escape(req.body.email)})`);
    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ msg: 'something wrong with server, please try again later' });
    }

    return res.send({ msg: 'registration completed' });
  } catch (err) {
    console.log(`${err} register`);
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/change-password', loggedIn, validation(changePasswordSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const [data] = await con.execute(
      `SELECT id, email, password FROM users WHERE id=${mysql.escape(req.user.id)} LIMIT 1`,
    );
    const chechHash = bcrypt.compareSync(req.body.oldPassword, data[0].password);

    if (!chechHash) {
      await con.end();
      return res.status(400).send({ err: 'Incorrect old password' });
    }

    const newPasswordHash = bcrypt.hashSync(req.body.newPassword, 10);

    const changePassDBRes = await con.execute(
      `UPDATE users SET password=${mysql.escape(newPasswordHash)} WHERE id=${req.user.id}`,
    );

    console.log(changePassDBRes);

    await con.end();
    return res.send({ msg: 'Password changed' });
  } catch (err) {
    console.log(`${err} change`);
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/reset-password', validation(resetPassword), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const [data1] = await con.execute(`SELECT id FROM users WHERE email = ${mysql.escape(req.body.email)} LIMIT 1`);

    if (data1.length !== 1) {
      await con.end();
      return res.send({ msg: 'If your email is correct, you will shortly get a message' });
    }

    const randomCode = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '');

    const [data2] = await con.execute(`
    INSERT INTO reset_tokens (email, code)
    VALUES (${mysql.escape(req.body.email)}, '${randomCode}')
  `);

    if (!data2.insertId) {
      return res.status(500).send({ msg: 'something wrong with server, please try again later' });
    }

    const response = await fetch(mailServer, {
      method: 'POST',
      body: JSON.stringify({
        password: mailServerPassword,
        email: req.body.email,
        message: `If you requested for a new password, please visit this link http://localhost:8080/v1/users/new-password?email=${encodeURI(
          req.body.email,
        )}&token=${randomCode}`,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await response.json();

    if (!json.info) {
      return res.status(500).send({ msg: 'something wrong with server, please try again later' });
    }

    return res.send({ msg: 'If your email is correct, you will shortly get a message' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/new-password', validation(newPassword), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const [data] = await con.execute(
      `SELECT * FROM reset_tokens WHERE email=${mysql.escape(req.body.email)} AND code=${mysql.escape(
        req.body.token,
      )} LIMIT 1`,
    );

    if (data.length !== 1) {
      await con.end();
      return res.status(400).send({ err: 'Invalid change password request. Please try again' });
    }

    if ((new Date().getTime() - new Date(data[0].timestamp).getTime()) / 60000 > 30) {
      await con.end();
      return res.status(400).send({ err: 'Invalid change password request. Please try again' });
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const [changeResponse] = await con.execute(`
      UPDATE users
      SET password = ${mysql.escape(hashedPassword)}
      WHERE email = ${mysql.escape(req.body.email)}
    `);

    if (!changeResponse.affectedRows) {
      await con.end();
      return res.status(500).send({ msg: 'something wrong with server, please try again later' });
    }

    await con.execute(`
      DELETE FROM reset_tokens
      WHERE id = ${data[0].id}
    `);

    await con.end();
    return res.send({ msg: 'Password change request complete' });
  } catch (err) {
    console.log(`${err} change`);
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

module.exports = router;
