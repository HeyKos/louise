const { WebClient }  = require("@slack/client"); 
// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const DeveloperModel = require("./models/Developer");
const token          = process.env.SLACK_TOKEN;
const botUserId      = process.env.BOT_USER_ID;
const web            = new WebClient(token);

function parseMessage(message, body) {
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
};

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

module.exports = parseMessage;