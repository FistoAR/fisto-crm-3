const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  employee_id: { type: String, required: true },
  action: { type: String, required: true },
  module: { type: String },
  ip_address: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
