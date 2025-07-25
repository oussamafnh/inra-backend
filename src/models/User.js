const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      unique: true,
      maxlength: 255,
    },
    password: {
      type: String,
      required: true,
      maxlength: 255,
    },
    auth_token: {
      type: String,
    },
    role: {
      type: String,
      enum: ['admin', 'chercheur'],
      default: 'chercheur',
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',

    },
    codeCentre: {
      type: String,
      maxlength: 255,
      required: false,
    },
    code: {
      type: String,
      maxlength: 255,
      required: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
