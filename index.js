const Bottr = require('./bottr')
const BottrApp = require('./ui')
const uuid = require('uuid/v1');
const path = require('path');
const ImageCreator = require('./createResult');
global.appRoot = path.resolve(__dirname);
const imgcreator = new ImageCreator(global.appRoot);
const Datastore = require('nedb'),
    db = new Datastore({
        filename: appRoot + '/whatkindofdeveloperareyou.db',
        autoload: true
    });
var surveybotlib = require('./surveybot');
const {
    fragebogenprogrammierung,
    skalen,
    profileActions,
    welcomeMessage,
    continueMessage,
    finishMessage
} = require('./fragebogenprogrammierung');
const bot = new Bottr.Bot();
bot.use(new BottrApp());
bot.listen();

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