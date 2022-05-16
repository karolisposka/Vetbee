/* eslint-disable prefer-template */
/* eslint-disable no-path-concat */
const express = require('express');
const fs = require('fs');
const mysql = require('mysql2/promise');
const multer = require('multer');
const loggedIn = require('../../middleware/auth');
const dbController = require('../../controller/database');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './docs'),
  filename: (req, file, cb) => cb(null, `${Math.floor(Math.random() * 1000)}.pdf`),
});

const upload = multer({ storage });

router.get('/', loggedIn, async (req, res) => {
  try {
    const data = await dbController(`SELECT * FROM documents WHERE user_id = ${req.user.id}`);
    return res.send(data);
  } catch (err) {
    return res.status(500).send({ err: 'Incorrect data' });
  }
});

router.get('/:filename', loggedIn, async (req, res) => {
  try {
    const data = await dbController(`SELECT * FROM documents WHERE filename = ${mysql.escape(req.params.filename)}`);

    if (req.user.id === data[0].user_id) {
      const file = fs.readFileSync(__dirname + `/../../../docs/${req.params.filename}`);
      return res.end(file);
    }

    return res.status(401).send({ err: 'Unauthorized' });
  } catch (err) {
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

router.post('/', loggedIn, upload.single('document'), async (req, res) => {
  try {
    const data = await dbController(`
        INSERT INTO documents (filename, user_id)
        VALUES ('${req.file.filename}', ${req.user.id})
    `);

    if (!data.insertId) {
      return res.status(500).send({ msg: 'something wrong with server, please try again later' });
    }

    return res.send({ msg: 'Successfully added a document' });
  } catch (err) {
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

module.exports = router;
