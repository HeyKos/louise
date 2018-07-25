var mongoose = require('mongoose');

var DeveloperSchema = new mongoose.Schema({
  user_id:          String,
  name:             String,
  active:           Boolean,
  last_review_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Developer', DeveloperSchema);
