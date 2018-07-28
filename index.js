var dotenv   = require('dotenv').config();
// var slackbot = require('./helpers/bot'); // import slackbot library
var mongoose = require('mongoose');  // import mongoose library for accessing MongoDB

// BEGIN

// Initialize using verification token from environment variables
const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);
const port = process.env.PORT || 3000;

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
slackEvents.on('message', (event) => {
  console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
});

// Handle errors (see `errorCodes` export)
slackEvents.on('error', console.error);

// Start a basic HTTP server
slackEvents.start(port).then(() => {
  console.log(`server listening on port ${port}`);
});

// END

// BEGIN EXPRESS SLACK CONFIG
// const http = require('http');

// // Initialize using verification token from environment variables
// const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
// const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);
// const port = process.env.PORT || 3000;

// // Initialize an Express application
// const express = require('express');
// const bodyParser = require('body-parser');
// const app = express();

// // You must use a body parser for JSON before mounting the adapter
// app.use(bodyParser.json());

// // Mount the event handler on a route
// // NOTE: you must mount to a path that matches the Request URL that was configured earlier
// app.use('/slack/events', slackEvents.expressMiddleware());

// // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
// slackEvents.on('message', (event)=> {
//   console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
// });

// // Handle errors (see `errorCodes` export)
// slackEvents.on('error', console.error);

// // Start the express application
// http.createServer(app).listen(port, () => {
//   console.log(`server listening on port ${port}`);
// });
// END EXPRESS SLACK CONFIG

/* Create MongoDB Connection */
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/louise', { useMongoClient: true, promiseLibrary: require('bluebird') })
  .then(() =>  console.log('connection successful'))
  .catch((err) => console.error(err));
