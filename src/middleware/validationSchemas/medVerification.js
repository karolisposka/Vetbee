const Joi = require('joi');

const medAdd = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  price: Joi.number().required(),
});

module.exports = {
  medAdd,
};
