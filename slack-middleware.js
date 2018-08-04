const slackEventsApi = require("@slack/events-api");
// *** Initialize event adapter using verification token from environment variables ***
const slackEvents    = slackEventsApi.createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN, {
    includeBody: true
});
const slackMessageParser = require("./slack-message-parser");
// *** Attach listeners to the event adapter ***

// *** Greeting any user that says "hi" ***
slackEvents.on("message", slackMessageParser);

// Handle errors (see `errorCodes` export)
slackEvents.on("error", console.error);

module.exports = slackEvents.expressMiddleware();