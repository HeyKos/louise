var dotenv   = require('dotenv').config();
var mongoose = require('mongoose');  // import mongoose library for accessing MongoDB

// BEGIN EXPRESS CONFIG

const slackEventsApi = require('@slack/events-api');
const { WebClient } = require('@slack/client'); 
// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.SLACK_TOKEN;
const web = new WebClient(token);
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const botUserId = "UBX710JFN";
// *** Initialize event adapter using verification token from environment variables ***
const slackEvents = slackEventsApi.createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN, {
    includeBody: true
});

// Initialize an Express application
const app = express();
app.use(bodyParser.json());

// *** Plug the event adapter into the express app as middleware ***
app.use('/slack/events', slackEvents.expressMiddleware());

// *** Attach listeners to the event adapter ***

// *** Greeting any user that says "hi" ***
slackEvents.on('message', (message, body) => {
    console.log("received a message", message);
    if (message == undefined) {
        return;
    }

    if (message.channel == undefined) {
        return;
    }

    // Ignore bot messages.
    if (message.subtype === "bot_message") {
        return;
    }

    // Only reply to mentions of the bot
    if (message.text.indexOf(`<@${botUserId}>`) === -1) {
        return;
    }

    const conversationId = message.channel;

    // Check if the user is requesting a code review.
    if (message.text.indexOf("code review") > -1) {
        processCodeReviewRequest(conversationId);
    }
});

// Handle errors (see `errorCodes` export)
slackEvents.on('error', console.error);

// Start the express application
const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});

// END EXPRESS CONFIG

// BEGIN Bot Handlers

// TODO: Abstract this to a logic layer for the bot.
function processCodeReviewRequest(channelId) {
    // TODO: Parse the message, and determine which action to take.
    const message = "Okay your code reviewer is Mike Koser. Good luck"; 
    web.chat.postMessage({ channel: channelId, text: message })
    .then((res) => {
        // `res` contains information about the posted message
        console.log('Message sent: ', res.ts);
    })
    .catch(console.error);
}

// END Bot Handlers
  

/* Create MongoDB Connection */
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/louise', { useMongoClient: true, promiseLibrary: require('bluebird') })
  .then(() =>  console.log('connection successful'))
  .catch((err) => console.error(err));
