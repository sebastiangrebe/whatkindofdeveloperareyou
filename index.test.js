var expect = require('chai').expect;
var assert = require('chai').assert;
var should = require('chai').should();
var bot = require('./index');
const path = require('path');
const ImageCreator = require('./createResult');
var appRoot = path.resolve(__dirname);
var io = require('socket.io-client');
var client1;
var uuid = require('uuid/v1');
var id = uuid();

var socketURL = 'http://127.0.0.1:3000';

var options = {
    transports: ['websocket'],
    'force new connection': true
};


describe('bot', function () {
    this.timeout(10000);
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

    it('should be able to receive connections', function (done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            done();
        });
    });

    it('should give me a welcome message', function (done) {
        client1.on('message', function (message) {
            message.text.should.equal(bot.welcomeMessage);
            client1.disconnect();
            done();
        });
        client1.emit('message', {
            id: id,
            action: "init"
        });
    });

    it('should have a user database entry now', function (done) {
        bot.db.findOne({
            _id: id
        }, function (err, doc) {
            assert.isNull(err);
            doc._id.should.equal(id);
            doc.status.should.equal("offen");
            doc.step.should.equal(-1);
            done();
        });
    });

    it('should be able to start the survey', function (done) {
        var messages = 0;
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            client1.on('message', function (message) {
                if (messages === 1) {
                    message.text.should.equal("Dann auf die Plätze...");
                    client1.disconnect();
                    done();
                }
                if (messages === 0) {
                    message.text.should.equal(bot.welcomeMessage);
                    client1.emit('message', {
                        text: "ja"
                    });
                }
                messages++;
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });

    });

    it('should be able to answer the first question', function (done) {
        var messages = 0;
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            client1.on('message', function (message) {
                if (messages === 3) {
                    message.text.should.equal("Nächste Frage...");
                    client1.disconnect();
                    done();
                }
                if (messages === 2) {
                    client1.emit('message', {
                        text: "1"
                    });
                }
                if (messages === 0) {
                    message.text.should.equal(bot.welcomeMessage);
                    client1.emit('message', {
                        text: "ja"
                    });
                }
                messages++;
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });

    it('should be able to continue the survey based on an id', function (done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            client1.on('message', function (message) {
                message.text.should.equal(bot.continueMessage);
                client1.disconnect();
                done();
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });

    it('should be able to give me an error message', function (done) {
        var messages = 0;
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            client1.on('message', function (message) {
                if (messages === 4) {
                    message.text.should.equal("Ich habe deine Nachricht leider nicht verstanden");
                    client1.disconnect();
                    done();
                }
                if (messages === 3) {
                    client1.emit('message', {
                        text: "Fehler"
                    });
                }
                if (messages === 0) {
                    client1.emit('message', {
                        text: "ja"
                    });
                }
                messages++;
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });
});