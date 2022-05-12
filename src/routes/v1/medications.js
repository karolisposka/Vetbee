const express = require('express');
const fetch = require('node-fetch');
const validation = require('../../middleware/validation');
const loggedIn = require('../../middleware/auth');
const { medAdd } = require('../../middleware/validationSchemas/medVerification');

const router = express.Router();

router.post('/', loggedIn, validation(medAdd), async (req, res) => {
  try {
    const response = await fetch('http://146.190.225.138:1337/api/auth/local/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'nodejs',
        password: 'petras123',
      }),
    });
    const data = await response.json();

    console.log(data);

    const response2 = await fetch('http://146.190.225.138:1337/api/medications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${data.jwt}`,
      },
      body: JSON.stringify({
        data: {
          title: req.body.title,
          description: req.body.description,
          price: req.body.price,
        },
      }),
    });
    const data2 = await response2.json();
    console.log(data2);

    return res.send(data2);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'something wrong with server, please try again later' });
  }
});

module.exports = router;
