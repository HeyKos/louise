var dotenv   = require('dotenv').config();
// var slackbot = require('./helpers/bot'); // import slackbot library
var mongoose = require('mongoose');  // import mongoose library for accessing MongoDB

// BEGIN DERP

const slackEventsApi = require('@slack/events-api');
const SlackClient = require('@slack/client').WebClient;
const passport = require('passport');
const SlackStrategy = require('@aoberoi/passport-slack').default.Strategy;
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

// *** Initialize event adapter using verification token from environment variables ***
const slackEvents = slackEventsApi.createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN, {
    includeBody: true
});

// Initialize a data structures to store team authorization info (typically stored in a database)
const botAuthorizations = {}

// Helpers to cache and lookup appropriate client
// NOTE: Not enterprise-ready. if the event was triggered inside a shared channel, this lookup
// could fail but there might be a suitable client from one of the other teams that is within that
// shared channel.
const clients = {};
function getClientByTeamId(teamId) {
  if (!clients[teamId] && botAuthorizations[teamId]) {
    clients[teamId] = new SlackClient(botAuthorizations[teamId]);
  }
  if (clients[teamId]) {
    return clients[teamId];
  }
  return null;
}

// Initialize Add to Slack (OAuth) helpers
passport.use(new SlackStrategy({
    clientID: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    skipUserProfile: true,
  }, (accessToken, scopes, team, extra, profiles, done) => {
    botAuthorizations[team.id] = extra.bot.accessToken;
    done(null, {});
}));

// Initialize an Express application
const app = express();
app.use(bodyParser.json());

// Plug the Add to Slack (OAuth) helpers into the express app
app.use(passport.initialize());
app.get('/', (req, res) => {
  res.send('<a href="/auth/slack"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>');
});
app.get('/auth/slack', passport.authenticate('slack', {
  scope: ['bot']
}));
app.get('/auth/slack/callback',
  passport.authenticate('slack', { session: false }),
  (req, res) => {
    res.send('<p>Greet and React was successfully installed on your team.</p>');
  },
  (err, req, res, next) => {
    res.status(500).send(`<p>Greet and React failed to install</p> <pre>${err}</pre>`);
  }
);

// *** Plug the event adapter into the express app as middleware ***
app.use('/event', slackEvents.expressMiddleware());

// *** Attach listeners to the event adapter ***

// *** Greeting any user that says "hi" ***
slackEvents.on('message', (message, body) => {
    console.log("received a message", message);
    // Only deal with messages that have no subtype (plain messages) and contain 'hi'
    if (!message.subtype && message.text.indexOf('hi') >= 0) {
      // Initialize a client
      const slack = getClientByTeamId(body.team_id);
      // Handle initialization failure
      if (!slack) {
        return console.error('No authorization found for this team. Did you install this app again after restarting?');
      }
      // Respond to the message back in the same channel
      slack.chat.postMessage(message.channel, `Hello <@${message.user}>! :tada:`)
        .catch(console.error);
    }
});


// *** Responding to reactions with the same emoji ***
slackEvents.on('reaction_added', (event, body) => {
    // Initialize a client
    const slack = getClientByTeamId(body.team_id);
    // Handle initialization failure
    if (!slack) {
      return console.error('No authorization found for this team. Did you install this app again after restarting?');
    }
    // Respond to the reaction back with the same emoji
    slack.chat.postMessage(event.item.channel, `:${event.reaction}:`)
      .catch(console.error);
});

// Start the express application
const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});
  

// END DERP

// BEGIN HTTP

// Initialize using verification token from environment variables
// const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
// const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);
// const port = process.env.PORT || 3000;

// // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
// slackEvents.on('message', (event) => {
//   console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
// });

// // Handle errors (see `errorCodes` export)
// slackEvents.on('error', console.error);

// // Start a basic HTTP server
// slackEvents.start(port).then(() => {
//   console.log(`server listening on port ${port}`);
// });

// END HTTP

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
