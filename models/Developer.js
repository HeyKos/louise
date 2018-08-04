var mongoose = require('mongoose');

var DeveloperSchema = new mongoose.Schema({
  userId:         String,
  name:           String,
  active:         Boolean,
  lastReviewDate: { type: Date, default: Date.now },
  slackUserId:    String,
});

module.exports = mongoose.model('Developer', DeveloperSchema);
