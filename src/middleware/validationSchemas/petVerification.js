const Joi = require('joi');

const petRegistration = Joi.object({
  ownerEmail: Joi.string().email().lowercase().required(),
  name: Joi.string().required(),
});

module.exports = {
  petRegistration,
};
