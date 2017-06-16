var expect = require('chai').expect;
var assert = require('chai').assert;
var should = require('chai').should();
var bot = require('./index');
const path = require('path');
const ImageCreator = require('./createResult');
var appRoot = path.resolve(__dirname);
var io = require('socket.io-client');
var connection;
var client1;

var socketURL = 'http://127.0.0.1:3000';

var options = {
    transports: ['websocket'],
    'force new connection': true
};


describe('bot', function () {

    it('should work!', function () {
        expect(true).to.be.true;
    });
    it('should have a database', function (done) {
        bot.db.filename.should.equal(appRoot + '/whatkindofdeveloperareyou.db');
        bot.db.inMemoryOnly.should.equal(false);
        bot.db.find({}, function (err, docs) {
            assert.isNull(err);
            docs.length.should.equal(0);
            done();
        });
    });
    
    it('should be able to receive connections', function () {
        client1 = io.connect(socketURL, options);
        connection = client1.on('connect', function (data) {

        });
    });

    it('should give me a welcome message', function (done) {
        this.timeout(10000);
        client1.on('message',function(message) {
            message.text.should.equal(bot.welcomeMessage);
            done();
        });
        client1.emit('message', {
            id: "Test",
            action: "init"
        });
    });
});