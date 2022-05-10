const express = require('express');
const fetch = require('node-fetch');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const router = express.Router();
const jsonwebtoken = require('jsonwebtoken');
const { mySqlConfig, jwtToken } = require('../../config');
const userValidation = require('../../middleware/validation');
const {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resetPassword,
} = require('../../middleware/ValidationSchemas/loginVerification');

router.post('/login', userValidation(loginSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const data = await con.execute(`SELECT * FROM users WHERE email=${mysql.escape(req.body.email)} LIMIT 1`);
    await con.end();
    const hash = bcrypt.compareSync(req.body.password, data[0][0].password);
    if (!hash) {
      return res.status(400).send({ msg: 'incorrect password' });
    }
    const token = jsonwebtoken.sign(data[0][0].id, jwtToken);
    return res.send({ msg: 'login successful', token });
  } catch (err) {
    console.log(`${err} pirmas`);
    res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/register', userValidation(registerSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    console.log('super');
    const hash = bcrypt.hashSync(req.body.password, 10);
    const data = await con.execute(`INSERT INTO users (username, password, email)
    VALUES (${mysql.escape(req.body.username)}, ${mysql.escape(hash)},${mysql.escape(req.body.email)})`);
    await con.end();
    res.send({ msg: 'registration completed', data });
  } catch (err) {
    console.log(`${err} register`);
    res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/changePassword', userValidation(changePasswordSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const data = await con.execute(`SELECT * FROM users WHERE password=${mysql.escape(req.body.email)}`);
    const hash = bcrypt.compareSync(req.body.oldPassword, data[0][0].password);
    if (hash) {
      const newPasswordHash = bcrypt.hashSync(req.body.newPassword, 10);
      con.execute(
        `UPDATE users SET password=${mysql.escape(newPasswordHash)} WHERE email=${mysql.escape(req.body.email)}`,
      );
      await con.end();
      res.send({ msg: 'Password changed' });
    }
  } catch (err) {
    console.log(`${err} change`);
    res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/password/reset', userValidation(resetPassword), async (req, res) => {
  try {
    const randomPassword = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '');
    const hashedPassword = bcrypt.hashSync(randomPassword, 10);
    if (hashedPassword) {
      const con = await mysql.createConnection(mySqlConfig);
      await con.execute(
        `UPDATE users SET password=${mysql.escape(hashedPassword)} WHERE email=${mysql.escape(req.body.email)}`,
      );
      await con.end();
      fetch('https://dolphin-app-gsx4u.ondigitalocean.app/send', {
        method: 'POST',
        body: JSON.stringify({
          password: 'PetrasGeriausiasDestytojas',
          email: req.body.email,
          message: `Your new password is ${randomPassword}`,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then((res) => res.json())
        .then((json) => console.log(json.info));
    }
    res.send({ msg: `new password has been sent to ${req.body.email}` });
  } catch (err) {
    console.log(err);
    res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

module.exports = router;
