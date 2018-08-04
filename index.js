var dotenv   = require("dotenv").config();
var mongoose = require("mongoose");  // import mongoose library for accessing MongoDB

// BEGIN EXPRESS CONFIG

const slackEventsApi = require("@slack/events-api");
const { WebClient }  = require("@slack/client"); 
// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token          = process.env.SLACK_TOKEN;
const web            = new WebClient(token);
const http           = require("http");
const express        = require("express");
const bodyParser     = require("body-parser");
const DeveloperModel = require("./models/Developer");
const botUserId      = process.env.BOT_USER_ID;
// *** Initialize event adapter using verification token from environment variables ***
const slackEvents    = slackEventsApi.createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN, {
    includeBody: true
});
// Initialize an Express application
const app            = express();

app.use(bodyParser.json());

// *** Plug the event adapter into the express app as middleware ***
app.use("/slack/events", slackEvents.expressMiddleware());

// *** Attach listeners to the event adapter ***

// *** Greeting any user that says "hi" ***
slackEvents.on("message", (message, body) => {
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
        processCodeReviewRequest(conversationId, message.user);
    }
});

// Handle errors (see `errorCodes` export)
slackEvents.on("error", console.error);

// Start the express application
const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});

// END EXPRESS CONFIG

// BEGIN Bot Handlers

// TODO: Abstract this to a logic layer for the bot.
function processCodeReviewRequest(channelId, slackUserId) {
    // TODO: Parse the message, and determine which action to take.
    const promise = findUser(slackUserId).then((developers) => {
        if (developers == undefined || developers.length === 0) {
            web.chat.postMessage({ channel: channelId, text: "Sorry, but there are no developers available for a code review." })
            .then((res) => {
                // `res` contains information about the posted message
                console.log("Message sent: ", res.ts);
            })
            .catch(console.error);            
            return;
        }
        console.log("found developers", developers);
        const developer = developers[0];
        developer.lastReviewDate = new Date();
        DeveloperModel.update({ userId: developer.userId }, developer, {}, (err, raw) => {
            if (err) {
                console.log("Error updating the developer record", err);
                return;
            }
            console.log("The raw update response was ", raw);
        });
        const message = `Okay your code reviewer is ${ developer.name }. Good luck`; 
        web.chat.postMessage({ channel: channelId, text: message })
        .then((res) => {
            // `res` contains information about the posted message
            console.log("Message sent: ", res.ts);
        })
        .catch(console.error);
    }).catch((err) => {
        console.log("Error finding user", err);
    });
}

function findUser(slackUserId) {
    // Find the user who is active and has not reviewed for the longest time.
    return DeveloperModel.find({ active: true })
            .where("slackUserId").ne(slackUserId)
            .sort({ "lastReviewDate": "asc" })
            .sort({ "name": "asc" })
            .limit(1)
            .exec();
}

// END Bot Handlers

/* Create MongoDB Connection */
mongoose.Promise = require("bluebird");
mongoose.connect(process.env.CONNECTION_STRING, { useMongoClient: true, promiseLibrary: require("bluebird") })
  .then(() =>  console.log("connection successful"))
  .catch((err) => console.error(err));

// BEGIN SEEDS

// Delete all developers
DeveloperModel.remove({}, (err) => {
    if (err) {
        console.log("Error clearing developers from database", err);
        return;
    }
    console.log("Removed all developers from the database.");
    var developers = require("./data/developerSeeds.js");
    // insert all developers
    DeveloperModel.insertMany(developers, (err) => {
        if (err) { console.log("Error seeding users", err) }
    });
})

// END SEEDS