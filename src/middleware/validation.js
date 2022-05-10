const joi = require('joi');

const userValidation = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.validateAsync(req.body);
    return next();
  } catch (err) {
    res.status(400).send({ msg: 'wrong data passed' });
  }
};

module.exports = userValidation;
