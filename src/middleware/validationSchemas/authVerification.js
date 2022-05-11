const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().lowercase().min(6).max(16).required(),
});

const registerSchema = Joi.object({
  username: Joi.string().lowercase().required(),
  password: Joi.string().lowercase().required(),
  email: Joi.string().email().required(),
});

const changePasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  oldPassword: Joi.string().lowercase().required(),
  newPassword: Joi.string().lowercase().min(8).max(16).required(),
});

const resetPassword = Joi.object({
  email: Joi.string(),
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  resetPassword,
};
