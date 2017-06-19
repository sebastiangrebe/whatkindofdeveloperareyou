class SurveyBot {
    constructor(props) {
        for (let prop in props) {
            this[prop] = props[prop];
        }

        this.createMessageReceiver = this.createMessageReceiver.bind(this);
        this.createYesReceiver = this.createYesReceiver.bind(this);
        this.createNumberReceiver = this.createNumberReceiver.bind(this);
        this.createProfileCommandReceiver = this.createProfileCommandReceiver.bind(this);
        this.decideNextAction = this.decideNextAction.bind(this);
        this.createPersonalResult = this.createPersonalResult.bind(this);
        this.startFB = this.startFB.bind(this);
        this.continueFB = this.continueFB.bind(this);
        this.finishFB = this.finishFB.bind(this);
        this.receiveMultiFrage = this.receiveMultiFrage.bind(this);
        this.calcMultiTwo = this.calcMultiTwo.bind(this);
        this.createUserContext = this.createUserContext.bind(this);
        this.updateUserContext = this.updateUserContext.bind(this);
        this.sendFurtherCommands = this.sendFurtherCommands.bind(this);
        this.receiveProfileName = this.receiveProfileName.bind(this);
        this.receiveProfilePic = this.receiveProfilePic.bind(this);
        this.createNavigationReceiver = this.createNavigationReceiver.bind(this);
        this.createMessageReceiver();
        this.createYesReceiver();
        this.createNumberReceiver();
        this.createProfileCommandReceiver();
        this.createNavigationReceiver();
    }

    createMessageReceiver() {
        var self = this;
        this.bot.on('message_received', function (message, session, next) {
            if (message.action === 'init') {
                self.db.findOne({
                    _id: message.id
                }, function (err, doc) {
                    if (!err) {
                        let context = session.getUserContext();
                        if (doc) {
                            doc.exclusive = false;
                            session.updateUserContext(doc);
                            context = doc;
                        } else {
                            if (Object.keys(context).length === 0 || context._id !== message.id) {
                                self.createUserContext(session, message);
                                context = session.getUserContext();
                            }
                        }
                        self.decideNextAction(session, context);
                    }
                })
            } else {
                let context = session.getUserContext();
                if (context.exclusive) {
                    context.exclusive(message, session, next);
                } else {
                    return next();
                }
            }
        });
    }

    createYesReceiver() {
        var self = this;
        this.bot.hears([/start/i, /on/i, /kann losgehen/i, /\bja\b/i, /ja!/i, /jo/i, /yo/i, /yeah/i], function (message, session) {
            let context = session.getUserContext();
            if (context.step === -1) {
                self.startFB(session);
            } else {
                if (context.status === 'teilbefragt' || (context.status === 'offen' && context.step === 0)) {
                    session.send('Es geht weiter!');
                }
                self.continueFB(session);
            }
        });
    }

    createNumberReceiver() {
        var self = this;
        this.bot.hears([/\b[0-9]+\b/], function (message, session) {
            let context = session.getUserContext();
            if (context.step === -1) {
                session.send('Deine Nachricht macht an dieser Stelle noch keinen Sinn!');
            } else {
                if (context.step === 0) {
                    context.status = 'teilbefragt';
                }
                let wert = parseInt(message.text, 10);
                wert = self.checkRatingAnswer(self.fragebogenprogrammierung[context.step], wert);
                if (wert) {
                    context.results[self.fragebogenprogrammierung[context.step].id] = {
                        wert: wert
                    }
                    context.step++;
                    self.updateUserContext(session, context);
                    self.continueFB(session);
                } else {
                    session.send('Deine Antwort liegt nicht innerhalb der Skalen! Versuch es noch einmal.');
                }
            }
        });
    }

    createProfileCommandReceiver() {
        var self = this;
        this.bot.hears([/change profile/i], function (message, session) {
            var command = message.text.replace('change profile', "").trim();
            switch (command) {
                case 'pic':
                    session.updateUserContext({
                        exclusive: self.receiveProfilePic
                    });
                    session.send('Alles klar. Deine nächste Nachricht sollte ein Bild sein. Klicke einfach auf das File Icon unten rechts und wähle ein Profilbild aus.');
                    break;
                case 'name':
                    session.updateUserContext({
                        exclusive: self.receiveProfileName
                    });
                    session.send('Alles klar. Deine nächste Nachricht sollte deinen Namen enthalten.');
                    break;
            }
        });
    }

    createNavigationReceiver() {
        var self = this;
        this.bot.hears([/weiter/i], function (message, session) {
            let context = session.getUserContext();
            let status = self.checkStatus(context,session);
            if (status) {
                if (context.step < self.fragebogenprogrammierung.length - 1 &&
                    typeof context.results[self.fragebogenprogrammierung[context.step].id] !== typeof undefined &&
                    typeof context.results[self.fragebogenprogrammierung[context.step].id].wert !== typeof undefined) {
                    context.step++;
                    self.updateUserContext(session, context);
                    self.continueFB(session);
                } else {
                    session.send('Du musst zuerst die aktuelle Frage beantworten.')
                }
            }
        });

        this.bot.hears([/zurück/i], function (message, session) {
            let context = session.getUserContext();
            let status = self.checkStatus(context,session);
            if (status) {
                if (context.step > 0) {
                    context.step--;
                    self.updateUserContext(session, context);
                    self.continueFB(session);
                } else {
                    session.send('Du hast noch keine Frage beantwortet');
                }
            }
        });
    }

    checkStatus(context,session) {
        if (context.status !== 'offen' && context.status !== 'abgeschlossen') {
            return true;
        } else {
            if (context.status === 'abgeschlossen') {
                session.send('Du hast die Befragung bereits abgeschlossen und kannst dein Ergebnis nicht mehr bearbeiten.')
            } else {
                session.send('Du musst zuerst eine Frage beantworten.');
            }
        }
        return false;
    }


    receiveProfilePic(message, session, next) {
        if (typeof message.text !== typeof undefined) {
            session.send('Dein Bild muss als Datei und nicht als Text geschickt werden! Versuch es noch einmal.');
        } else {
            if (typeof message.attachments !== typeof undefined && message.attachments.length) {
                let image = message.attachments[0];
                if (image.type.indexOf('image') !== -1) {
                    let context = session.getUserContext();
                    context.profile_pic = image;
                    context.exclusive = false;
                    this.updateUserContext(session, context);
                    session.send('Danke wir haben dein Bild gespeichert! Hier deine aktualisierten Ergebnisse!');
                    this.createPersonalResult(session, context, true);
                } else {
                    session.send('Du musst eine Bild Datei schicken. Versuch es noch einmal.');
                }
            } else {
                session.send('Leider ist nichts angekommen. Versuch es noch einmal.');
            }
        }
    }

    receiveProfileName(message, session, next) {
        let context = session.getUserContext();
        context.name = message.text;
        context.exclusive = false;
        this.updateUserContext(session, context);
        session.send('Danke wir haben deinen Namen gespeichert! Hier deine aktualisierten Ergebnisse!');
        this.createPersonalResult(session, context, true);
    }

    checkRatingAnswer(frage, wert) {
        if (frage.type === 'rating' && typeof frage.skala !== typeof undefined) {
            if (wert >= frage.skala.min && wert <= frage.skala.max) {
                return wert;
            }
        } else {
            return wert;
        }
        return false;
    }

    decideNextAction(session, context) {
        switch (context.status) {
            case 'offen':
                session.send(this.welcomeMessage);
                break;
            case 'teilbefragt':
                session.send(this.continueMessage);
                break;
            case 'abgeschlossen':
                session.send(this.finishMessage);
                this.createPersonalResult(session, context);
                break;
        }
    }

    createPersonalResult(session, context, overwrite) {
        var self = this;
        if (typeof context.resultImage === typeof undefined || (typeof overwrite !== typeof undefined && overwrite)) {
            this.imgcreator.createPersonalResult(context, this.fragebogenprogrammierung).then((img) => {
                img = 'data:image/png;base64,' + img;
                context.resultImage = img;
                self.updateUserContext(session, context);
                session.send('Das kannst du dir gerne an die Wand hängen!', {
                    type: 'image.*',
                    url: img
                });
                if (!overwrite) {
                    self.sendFurtherCommands(session, context);
                }
            });
        } else {
            session.send('Das kannst du dir gerne an die Wand hängen!', {
                type: 'image.*',
                url: context.resultImage
            });
            this.sendFurtherCommands(session, context);
        }
    }

    sendRecognition(session) {
        session.send('Nächste Frage...');
    }

    startFB(session) {
        session.send('Du kannst mit den Worten Zurück und Weiter im Fragebogen navigieren.');
        if (typeof this.fragebogenprogrammierung[0].frage !== typeof undefined &&
            typeof this.fragebogenprogrammierung[0].skala !== typeof undefined &&
            typeof this.fragebogenprogrammierung[0].id !== typeof undefined &&
            typeof this.fragebogenprogrammierung[0].type !== typeof undefined) {
            let context = session.getUserContext();
            context.step = 0;
            this.updateUserContext(session, context);
            this.continueFB(session);
        }
    }

    continueFB(session) {
        let context = session.getUserContext();
        if (context.step > this.fragebogenprogrammierung.length - 1) {
            this.finishFB(session);
        } else {
            if (context.step > 0) {
                this.sendRecognition(session);
            }
            switch (this.fragebogenprogrammierung[context.step].type) {
                case 'rating':
                    this.sendRatingFrage(session, this.fragebogenprogrammierung[context.step]);
                    break;
                case 'multi':
                    this.sendMultiFrage(session, this.fragebogenprogrammierung[context.step]);
                    break;
            }
        }
    }

    finishFB(session) {
        let context = session.getUserContext();
        context.status = 'abgeschlossen';
        this.createPersonalResult(session, context);
        this.updateUserContext(session, context);
        session.send(this.finishMessage);
    }

    sendRatingFrage(session, frage) {
        var questionString = "";
        questionString += this.skalen[frage.skala.type].headline + '\n';
        questionString += this.skalen[frage.skala.type].einleitung +
            frage.skala.min + ' = ' + this.skalen[frage.skala.type].min +
            ' bis ' +
            frage.skala.max + ' = ' + this.skalen[frage.skala.type].max + '.\n';
        questionString += frage.frage;
        session.send(questionString);
    }

    sendMultiFrage(session, frage) {
        var questionString = frage.frage;
        switch (frage.action.type) {
            case 'one':
                for (let index in frage.action.one) {
                    if (frage.action.one.hasOwnProperty(index)) {
                        questionString += '\n' + (parseInt(index, 10) + 1) + ') ' + frage.action.one[index].text;
                    }
                }
                break;
            case 'two':
                break;
        }
        questionString += '\n' + frage.skala.text + '\nDeine nächste Nachricht wird als Antwort auf diese Frage gewertet!';
        session.updateUserContext({
            exclusive: this.receiveMultiFrage
        });
        session.send(questionString);
    }

    receiveMultiFrage(message, session, next) {
        let context = session.getUserContext();
        if (context.step === -1) {
            session.send('Ups da hab ich mich wohl vertan. Ich hab dich leider nicht verstanden. Versuch es einfach nochmal')
        } else {
            if (context.step === 0) {
                context.status = 'teilbefragt';
            }
            let wert = {};
            let valid = false;
            let frage = this.fragebogenprogrammierung[context.step];
            switch (frage.action.type) {
                case 'one':
                    var selected = parseInt(message.text, 10) - 1;
                    if (selected >= 0 && selected < frage.action.one.length) {
                        wert = frage.action.one[selected].wert;
                        valid = true;
                    }
                    break;
                case 'two':
                    wert.one = {};
                    wert.two = {};
                    var countone = 0;
                    var counttwo = 0;
                    var text = message.text.split(',');
                    var first = this.calcMultiTwo(frage, 'one', text);
                    frage = first.frage;
                    countone = first.count;
                    wert.one = first.wert;
                    var second = this.calcMultiTwo(frage, 'two', text);
                    frage = second.frage;
                    counttwo = second.count;
                    wert.two = second.wert;
                    wert.ergebnis = countone - counttwo;
                    if (countone !== 0 || counttwo !== 0) {
                        valid = true;
                    }
                    break;
            }
            if (valid) {
                context.results[frage.id] = {
                    original: message.text,
                    wert: wert
                }
                context.step++;
                context.exclusive = false;
                this.updateUserContext(session, context);
                this.continueFB(session);
            } else {
                session.send('Deine Eingabe scheint nicht korrekt zu sein. Versuch es noch einmal!');
            }
        }
    }

    calcMultiTwo(frage, index, text) {
        var array = frage.action[index];
        var count = 0;
        var wert = {}
        for (var prop in frage.action[index]) {
            for (var item in text) {
                if (Object.prototype.hasOwnProperty.call(text, item)) {
                    if (this.checkIfWertEquals(text[item], frage.action[index][prop])) {
                        wert[frage.action[index][prop]] = 1;
                        count++;
                    } else {
                        wert[frage.action[index][prop]] = 0;
                    }
                }
            }
        }
        return {
            frage,
            count,
            wert
        };
    }

    checkIfWertEquals(wert, comp) {
        return (wert.trim().toLowerCase() === comp.trim().toLowerCase());
    }

    createUserContext(session, message) {
        let user = {
            _id: message.id,
            results: {

            },
            status: 'offen',
            step: -1
        };
        session.updateUserContext(user);
        this.db.insert(user);
    }

    updateUserContext(session, data) {
        let context = session.getUserContext();
        this.db.update({
            _id: context._id
        }, data, {}, function (err, numReplaced) {
            if (err && err !== null) {
                session.send('Leider hat das nicht so ganz funktioniert. Lade bitte die Seite neu!');
            }
        });
        session.updateUserContext(data);
    }

    sendFurtherCommands(session, context) {
        var commandString = 'Du kannst die Art wie deine Ergebnisse anpassen. Hier die sehr kurze Kommandoliste:\n';
        for (let prop in this.profileActions) {
            commandString += prop + ') ' + this.profileActions[prop].command + " " + this.profileActions[prop].parameter + '\n';
        }
        commandString += 'Außerdem kannst du ganz einfach die allgemeinen Ergebnisse abrufen und siehst wie deine Kollegen abschneiden!\n Einfach "get global results" schicken.';
        session.send(commandString);
    }
}

module.exports = SurveyBot;