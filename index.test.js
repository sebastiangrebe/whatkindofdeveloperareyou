const chai = require('chai'),
    chaiHttp = require('chai-http');
const should = chai.should();
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

chai.use(chaiHttp);

describe('bot', function () {
    this.timeout(20000);
    it('should work!', function () {
        chai.expect(true).to.be.true;
    });
    it('should have a database', function (done) {
        bot.db.filename.should.equal(appRoot + '/whatkindofdeveloperareyou.db');
        bot.db.inMemoryOnly.should.equal(false);
        bot.db.find({}, function (err, docs) {
            chai.assert.isNull(err);
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

    it('should have a ui', function (done) {
        chai.request('http://localhost:3000')
            .get('/').then(function (res) {
                chai.expect(res).to.have.status(200);
                done();
            })
            .catch(function (err) {
                throw err;
            });
    });

    it('should give me a welcome message', function (done) {
        client1.on('message', function (message) {
            message.text.should.equal(bot.surveybot.welcomeMessage);
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
            chai.assert.isNull(err);
            doc._id.should.equal(id);
            doc.status.should.equal("offen");
            doc.step.should.equal(-1);
            done();
        });
    });

    it('should be able to give me an error message before starting the survey', function (done) {
        var messages = 0;
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            client1.on('message', function (message) {
                if (messages === 1) {
                    message.text.should.equal("Deine Nachricht macht an dieser Stelle noch keinen Sinn!");
                    client1.disconnect();
                    done();
                }
                if (messages === 0) {
                    message.text.should.equal(bot.surveybot.welcomeMessage);
                    client1.emit('message', {
                        text: "1"
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

    it('should be able to start the survey', function (done) {
        var messages = 0;
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            client1.on('message', function (message) {
                if (messages === 1) {
                    message.text.should.equal("Du kannst mit den Worten Zurück und Weiter im Fragebogen navigieren.");
                    client1.disconnect();
                    done();
                }
                if (messages === 0) {
                    message.text.should.equal(bot.surveybot.welcomeMessage);
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
                    message.text.should.equal(bot.surveybot.welcomeMessage);
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
                message.text.should.equal(bot.surveybot.continueMessage);
                client1.disconnect();
                done();
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });

    it('should be able to give me an error message during the survey', function (done) {
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
    var step = 0;
    for (var i = 1; i < bot.surveybot.fragebogenprogrammierung.length; i++) {
        if (i === 3) {
            it('should be able to navigate through the survey', function (done) {
                client1 = io.connect(socketURL, options);
                client1.on('connect', function (data) {
                    var messages = 0;
                    client1.on('message', function (message) {
                        if (messages === 8) {
                            message.text.should.equal('Du musst zuerst die aktuelle Frage beantworten.');
                            done();
                        }
                        if (messages === 7) {
                            client1.emit('message', {
                                text: "weiter"
                            });
                        }
                        if (messages === 6) {
                            message.text.should.equal('Nächste Frage...');
                        }
                        if (messages === 5) {
                            client1.emit('message', {
                                text: "weiter"
                            });
                        }
                        if (messages === 4) {
                            message.text.should.equal('Nächste Frage...');
                        }
                        if (messages === 3) {
                            client1.emit('message', {
                                text: "zurück"
                            });
                        }
                        if (messages === 2) {
                            message.text.should.equal('Nächste Frage...');
                        }
                        if (messages === 1) {
                            message.text.should.equal('Es geht weiter!');
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
        }
        if (i === 2) {
            it('should be able to answer the survey question ' + i, function (done) {
                client1 = io.connect(socketURL, options);
                client1.on('connect', function (data) {
                    var messages = 0;
                    var frage;
                    client1.on('message', function (message) {
                        if (messages === 5) {
                            if (step === bot.surveybot.fragebogenprogrammierung.length - 1) {
                                message.text.should.equal(bot.surveybot.finishMessage);
                            } else {
                                message.text.should.equal('Nächste Frage...');
                            }
                            client1.disconnect();
                            done();
                        }
                        if (messages === 4) {
                            message.text.should.equal("Deine Antwort liegt nicht innerhalb der Skalen! Versuch es noch einmal.");
                            step++;
                            switch (frage.type) {
                                case 'rating':
                                    client1.emit('message', {
                                        text: "1"
                                    });
                                    break;
                                case 'multi':
                                    switch (frage.action.type) {
                                        case 'one':
                                            client1.emit('message', {
                                                text: '1'
                                            });
                                            break;
                                        case 'two':
                                            client1.emit('message', {
                                                text: frage.action.one[0]
                                            });
                                            break;
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        if (messages === 3) {
                            for (var j = 0; j < bot.surveybot.fragebogenprogrammierung.length; j++) {
                                if (message.text.indexOf(bot.surveybot.fragebogenprogrammierung[j].frage) !== -1) {
                                    frage = bot.surveybot.fragebogenprogrammierung[j];
                                    break;
                                }
                            }
                            client1.emit('message', {
                                text: "999"
                            });
                        }
                        if (messages === 2) {
                            message.text.should.equal('Nächste Frage...');
                        }
                        if (messages === 1) {
                            message.text.should.equal('Es geht weiter!');
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
        } else {
            it('should be able to answer the survey question ' + i, function (done) {
                client1 = io.connect(socketURL, options);
                client1.on('connect', function (data) {
                    var messages = 0;
                    client1.on('message', function (message) {
                        if (messages === 4) {
                            if (step === bot.surveybot.fragebogenprogrammierung.length - 1) {
                                message.text.should.equal(bot.surveybot.finishMessage);
                            } else {
                                message.text.should.equal('Nächste Frage...');
                            }
                            client1.disconnect();
                            done();
                        }
                        if (messages === 3) {
                            step++;
                            var frage;
                            for (var j = 0; j < bot.surveybot.fragebogenprogrammierung.length; j++) {
                                if (message.text.indexOf(bot.surveybot.fragebogenprogrammierung[j].frage) !== -1) {
                                    frage = bot.surveybot.fragebogenprogrammierung[j];
                                    break;
                                }
                            }
                            switch (frage.type) {
                                case 'rating':
                                    client1.emit('message', {
                                        text: "1"
                                    });
                                    break;
                                case 'multi':
                                    switch (frage.action.type) {
                                        case 'one':
                                            client1.emit('message', {
                                                text: '1'
                                            });
                                            break;
                                        case 'two':
                                            client1.emit('message', {
                                                text: frage.action.one[0]
                                            });
                                            break;
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        if (messages === 2) {
                            message.text.should.equal('Nächste Frage...');
                        }
                        if (messages === 1) {
                            message.text.should.equal('Es geht weiter!');
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
        }
    }

    it('should be able to recognize that the survey is finished', function (done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            client1.on('message', function (message) {
                message.text.should.equal(bot.surveybot.finishMessage);
                client1.disconnect();
                done();
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });

    it('should be able to send me my results', function (done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            var messages = 0;
            client1.on('message', function (message) {
                if (messages === 1) {
                    message.text.should.equal("Das kannst du dir gerne an die Wand hängen!");
                    chai.expect(message).to.have.property('attachment');
                    chai.expect(message).to.be.an('object');
                    message.attachment.type.should.equal("image.*");
                    chai.expect(message.attachment.url).to.be.an('string');
                    client1.disconnect();
                    done();
                }
                if (messages === 0) {
                    message.text.should.equal(bot.surveybot.finishMessage);
                }
                messages++;
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });

    it('should be able to change my profile name', function (done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            var messages = 0;
            client1.on('message', function (message) {
                if (messages === 4) {
                    message.text.should.equal('Danke wir haben deinen Namen gespeichert! Hier deine aktualisierten Ergebnisse!');
                    client1.disconnect();
                    done();
                }
                if (messages === 3) {
                    message.text.should.equal('Alles klar. Deine nächste Nachricht sollte deinen Namen enthalten.');
                    client1.emit('message', {
                        text: 'Test'
                    });

                }
                if (messages === 2) {
                    client1.emit('message', {
                        text: 'change profile name'
                    });
                }
                if (messages === 0) {
                    message.text.should.equal(bot.surveybot.finishMessage);
                }
                messages++;
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });

    it('should be able to send me an error for an invalid change profile command', function (done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            var messages = 0;
            client1.on('message', function (message) {
                if (messages === 3) {
                    message.text.should.equal('Ich hab dich nicht verstanden versuch es noch einmal!');
                    client1.disconnect();
                    done();
                }
                if (messages === 2) {
                    client1.emit('message', {
                        text: 'change profile fehler'
                    });
                }
                if (messages === 0) {
                    message.text.should.equal(bot.surveybot.finishMessage);
                }
                messages++;
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });

    it('should be able to get the global results', function (done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            var messages = 0;
            client1.on('message', function (message) {
                if (messages === 3) {
                    chai.expect(message).to.have.property('attachment');
                    chai.expect(message).to.be.an('object');
                    message.attachment.type.should.equal("image.*");
                    chai.expect(message.attachment.url).to.be.an('string');
                    client1.disconnect();
                    done();
                }
                if (messages === 2) {
                    client1.emit('message', {
                        text: 'get global results'
                    });
                }
                if (messages === 0) {
                    message.text.should.equal(bot.surveybot.finishMessage);
                }
                messages++;
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });

    it('should be able to give me an error when incorrectly changing my profile pic', function (done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            var messages = 0;
            client1.on('message', function (message) {
                if (messages === 7) {
                    message.text.should.equal('Du musst eine Bild Datei schicken. Versuch es noch einmal.');
                    client1.disconnect();
                    done();
                }
                if (messages === 6) {
                    message.text.should.equal('Leider ist nichts angekommen. Versuch es noch einmal.');
                    client1.emit('message', {
                        attachments: [{
                            type: 'fehler',
                            data: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD//gATQ3JlYXRlZCB3aXRoIEdJTVD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAT/n/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k="
                        }]
                    });
                }
                if (messages === 5) {
                    message.text.should.equal('Leider ist nichts angekommen. Versuch es noch einmal.');
                    client1.emit('message', {

                    });
                }
                if (messages === 4) {
                    message.text.should.equal('Dein Bild muss als Datei und nicht als Text geschickt werden! Versuch es noch einmal.');
                    client1.emit('message', {

                    });
                }
                if (messages === 3) {
                    message.text.should.equal('Alles klar. Deine nächste Nachricht sollte ein Bild sein. Klicke einfach auf das File Icon unten rechts und wähle ein Profilbild aus.');
                    client1.emit('message', {
                        text: "fehler"
                    });
                }
                if (messages === 2) {
                    client1.emit('message', {
                        text: 'change profile pic'
                    });
                }
                if (messages === 0) {
                    message.text.should.equal(bot.surveybot.finishMessage);
                }
                messages++;
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });

    it('should be able to change my profile pic', function (done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            var messages = 0;
            client1.on('message', function (message) {
                if (messages === 4) {
                    message.text.should.equal('Danke wir haben dein Bild gespeichert! Hier deine aktualisierten Ergebnisse!');
                    client1.disconnect();
                    done();
                }
                if (messages === 3) {
                    message.text.should.equal('Alles klar. Deine nächste Nachricht sollte ein Bild sein. Klicke einfach auf das File Icon unten rechts und wähle ein Profilbild aus.');
                    client1.emit('message', {
                        attachments: [{
                            type: 'image',
                            data: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD//gATQ3JlYXRlZCB3aXRoIEdJTVD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAT/n/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k="
                        }]
                    });
                }
                if (messages === 2) {
                    client1.emit('message', {
                        text: 'change profile pic'
                    });
                }
                if (messages === 0) {
                    message.text.should.equal(bot.surveybot.finishMessage);
                }
                messages++;
            });
            client1.emit('message', {
                id: id,
                action: "init"
            });
        });
    });

    it('should be able to give me an error when trying to navigate through a finished survey', function (done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function (data) {
            var messages = 0;
            client1.on('message', function (message) {
                if (messages === 3) {
                    message.text.should.equal('Du hast die Befragung bereits abgeschlossen und kannst dein Ergebnis nicht mehr bearbeiten.');
                    client1.disconnect();
                    done();
                }
                if (messages === 1) {
                    client1.emit('message', {
                        text: "zurück"
                    });
                }
                if (messages === 0) {
                    message.text.should.equal(bot.surveybot.finishMessage);
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