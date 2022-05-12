const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(16).required(),
});

const registerSchema = Joi.object({
  username: Joi.string().lowercase().required(),
  password: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(16).required(),
});

const resetPassword = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const newPassword = Joi.object({
  email: Joi.string().email().lowercase().required(),
  token: Joi.string().required(),
  password: Joi.string().required(),
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  resetPassword,
  newPassword,
};
