const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    activite_id: {
      type: String,
      required: true,
    },
    day: {
      type: Date,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    user_full_name: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    megaprojet_id: {
      type: String,
      required: true,
    },
    axe_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

module.exports = ActivityLog;

module.exports = ActivityLog;
