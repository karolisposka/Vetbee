const express = require('express');
const fetch = require('node-fetch');
const Cryptr = require('cryptr');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const userValidation = require('../../middleware/validation');
const {
  mySqlConfig,
  jwtToken,
  mailServer,
  mailServerPassword,
  randomEmailCode,
  emailCrypter,
} = require('../../config');
const {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resetPassword,
} = require('../../middleware/validationSchemas/authVerification');

const router = express.Router();
const crypt = new Cryptr(emailCrypter);

router.post('/login', userValidation(loginSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const [data] = await con.execute(`SELECT * FROM users WHERE email=${mysql.escape(req.body.email)} LIMIT 1`);
    await con.end();

    if (data.length !== 1) {
      return res.status(400).send({ msg: 'Incorrect email or password' });
    }

    const checkHash = bcrypt.compareSync(req.body.password, data[0].password);

    if (!checkHash) {
      return res.status(400).send({ msg: 'Incorrect email or password' });
    }

    const token = jsonwebtoken.sign({ id: data[0].id }, jwtToken);
    return res.send({ msg: 'login successful', token });
  } catch (err) {
    console.log(`${err} pirmas`);
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/register', userValidation(registerSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const hash = bcrypt.hashSync(req.body.password, 10);
    const data = await con.execute(`INSERT INTO users (username, password, email)
    VALUES (${mysql.escape(req.body.username)}, ${mysql.escape(hash)},${mysql.escape(req.body.email)})`);
    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ msg: 'something wrong with server, please try again later' });
    }

    return res.send({ msg: 'registration completed', data });
  } catch (err) {
    console.log(`${err} register`);
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/change-password', userValidation(changePasswordSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const [data] = await con.execute(`SELECT * FROM users WHERE email=${mysql.escape(req.body.email)} LIMIT 1`);
    const chechHash = bcrypt.compareSync(req.body.oldPassword, data[0].password);

    if (!chechHash) {
      await con.end();
      return res.status(400).send({ err: 'Incorrect old password' });
    }

    const newPasswordHash = bcrypt.hashSync(req.body.newPassword, 10);

    con.execute(
      `UPDATE users SET password=${mysql.escape(newPasswordHash)} WHERE email=${mysql.escape(req.body.email)}`,
    );

    await con.end();
    return res.send({ msg: 'Password changed' });
  } catch (err) {
    console.log(`${err} change`);
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/temporary-code-email/', userValidation(resetPassword), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySqlConfig);
    const [data] = await con.execute(`SELECT * FROM users WHERE email=${mysql.escape(req.body.email)} LIMIT 1`);
    if (!data[0]) {
      return res.status(400).send({ msg: 'user does not exist' });
    }
    const randomPassword = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '');
    await con.execute(`INSERT INTO passwordResets (user_id, temporary_code)
    VALUES (${mysql.escape(data[0].id)}, ${mysql.escape(randomPassword)})`);
    await con.end();
    const url = `http://localhost:8080/v1/users/change-password-email/${crypt.encrypt(req.body.email)}/${crypt.encrypt(
      randomPassword,
    )}`;
    const response = await fetch(mailServer, {
      method: 'POST',
      body: JSON.stringify({
        password: mailServerPassword,
        email: req.body.email,
        message: `to reset password click ${url}`,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await response.json();
    console.log(json);
    return res.send({ msg: `new password has been sent to ${req.body.email}` });
  } catch (err) {
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

// router.post('/reset-password', userValidation(resetPassword), async (req, res) => {
//   try {
//     const randomPassword = Math.random()
//       .toString(36)
//       .replace(/[^a-z]+/g, '');
//     const hashedPassword = bcrypt.hashSync(randomPassword, 10);

//     const con = await mysql.createConnection(mySqlConfig);
//     const [data] = await con.execute(
//       `UPDATE users SET password=${mysql.escape(hashedPassword)} WHERE email=${mysql.escape(req.body.email)}`,
//     );
//     await con.end();

//     if (!data.affectedRows) {
//       return res.status(500).send({ msg: 'something wrong with server, please try again later' });
//     }

//     const response = await fetch(mailServer, {
//       method: 'POST',
//       body: JSON.stringify({
//         password: mailServerPassword,
//         email: req.body.email,
//         message: `Your new password is ${randomPassword}`,
//       }),
//       headers: { 'Content-Type': 'application/json' },
//     });
//     const json = await response.json();
//     console.log(json.info);

//     return res.send({ msg: `new password has been sent to ${req.body.email}` });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send({ msg: 'something wrong with server, please try again later' });
//   }
// });

router.get('/change-password-email/:email/:password', async (req, res) => {
  try {
    const decryptedEmail = crypt.decrypt(req.params.email);
    const decryptedPassword = crypt.decrypt(req.params.password);
    const con = await mysql.createConnection(mySqlConfig);
    const [data] = await con.execute(
      `SELECT * FROM passwordResets WHERE temporary_code=${mysql.escape(decryptedPassword)} LIMIT 1`,
    );
    if (!data[0].temporary_code) {
      return res.status(500).send({ msg: 'something wrong with server please try again later' });
    }
    const randomPassword = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '');
    const hashedPassword = bcrypt.hashSync(randomPassword, 10);
    const [updatePassword] = await con.execute(
      `UPDATE users SET password=${mysql.escape(hashedPassword)} WHERE id=${mysql.escape(data[0].user_id)}`,
    );
    await con.end();
    if (!updatePassword.affectedRows) {
      return res.status(500).send({ msg: 'something wrong with server, please try again later' });
    }

    const response = await fetch(mailServer, {
      method: 'POST',
      body: JSON.stringify({
        password: mailServerPassword,
        email: decryptedEmail,
        message: `Your new password is ${randomPassword}`,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await response.json();
    if (res) {
      return res.send({ msg: `new password has been send to ${decryptedEmail}` });
    }
  } catch (err) {
    res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

module.exports = router;
