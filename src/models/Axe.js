const mongoose = require('mongoose');

const axeSchema = new mongoose.Schema(
  {
    megaprojet_id: {
      type: String,
      required: true,
      maxlength: 255,
    },
    AXE: {
      type: String,
      required: true,
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

const Axe = mongoose.model('Axe', axeSchema);
module.exports = Axe;
