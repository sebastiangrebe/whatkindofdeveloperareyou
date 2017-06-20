//Import all needed packages
const Bottr = require('./bottr')
const BottrApp = require('./ui')
const uuid = require('uuid/v1');
const path = require('path');
const ImageCreator = require('./createResult');
const imgcreator = new ImageCreator();

global.appRoot = path.resolve(__dirname);
const Datastore = require('nedb'),
    db = new Datastore({
        filename: appRoot + '/whatkindofdeveloperareyou.db',
        autoload: true
    });

const surveybotlib = require('./surveybot');

// Import the survey from an external file
const {
    fragebogenprogrammierung,
    skalen,
    profileActions,
    welcomeMessage,
    continueMessage,
    finishMessage
} = require('./fragebogenprogrammierung');

// Start the webserver and listen for open connections
const bot = new Bottr.Bot();
bot.use(new BottrApp());
bot.listen();

// Create a new surveybot passing all needed arguments - the current parameters shown here are all required
var surveybot = new surveybotlib({
    bot: bot,
    imgcreator: imgcreator,
    fragebogenprogrammierung: fragebogenprogrammierung,
    skalen: skalen,
    profileActions: profileActions,
    welcomeMessage: welcomeMessage,
    continueMessage: continueMessage,
    finishMessage: finishMessage,
    db: db
});

module.exports = {
    db,
    bot,
    surveybot
}