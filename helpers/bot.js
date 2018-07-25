var SlackBot  = require('slackbots');
var mongoose  = require('mongoose');
var Developer = require('../models/Developer.js');

var bot = new SlackBot({
    token: process.env.BOT_API_KEY,
    name: 'SlackBot'
});

exports.run = () => {
    bot.on('start', onStart);
    bot.on('message', onMessage);
  }

var onStart = () => {
  console.log('Bot started');
}

var onMessage = (message) => {
    console.log("We got a message: " + message);
    // users = [];
    // channels = [];
    // var botUsers = bot.getUsers();
    // users = botUsers._value.members;
    // var botChannels = bot.getChannels();
    // channels = botChannels._value.channels;
  
    // if (message.type === 'message' && Boolean(message.text)) {
    //     var channel = channels.find(channel => channel.id === message.channel);
    //     var usr = users.find(user => user.id === message.user);
  
    //     if(usr.name !== 'louise') {
    //         bot.postMessageToChannel(channel.name, 'You just said: "' + message + '".' , { as_user: true });    
    //     }
    // }
}
