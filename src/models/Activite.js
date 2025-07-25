const mongoose = require('mongoose');

const activitesSchema = new mongoose.Schema(
  {
    megaprojet_id: {
      type: String,
      required: true,
      maxlength: 255,
    },
    axe_id: {
      type: String,
      required: true,
      maxlength: 255,
    },
    ACTIVITE: {
      type: String,
      required: true,
      maxlength: 255,
    },
    CRRA: {
      type: String,
      maxlength: 255,
    },
    CodeActivite: {
      type: String,
      required: true,
      maxlength: 50,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
  },
  { timestamps: true }
);

const Activite = mongoose.model('Activite', activitesSchema);
module.exports = Activite;
