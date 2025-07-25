const mongoose = require('mongoose');

const megaprojetsSchema = new mongoose.Schema(
  {
    MEGAPROJET: {
      type: String,
      required: true,
      maxlength: 255,
    },
    filiere: {
      type: String,
      maxlength: 255,
    },
    COORDINATEUR: {
      type: String,
      maxlength: 255,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
  },
  { timestamps: true }
);

const Megaprojet = mongoose.model('Megaprojet', megaprojetsSchema);
module.exports = Megaprojet;
