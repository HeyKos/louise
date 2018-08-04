var dotenv   = require("dotenv").config();
var mongoose = require("mongoose");  // import mongoose library for accessing MongoDB

// BEGIN EXPRESS CONFIG

const http           = require("http");
const express        = require("express");
const bodyParser     = require("body-parser");
const DeveloperModel = require("./models/Developer");
// Initialize an Express application
const app            = express();
const slackMiddleware = require("./slack-middleware"); 

app.use(bodyParser.json());
// *** Plug the event adapter into the express app as middleware ***
app.use("/slack/events", slackMiddleware);

// Start the express application
const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${ port }`);
});

// END EXPRESS CONFIG

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