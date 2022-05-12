const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (e) {
    console.log(e);
    return res.status(401).send({ err: 'Validation failed' });
  }
};
