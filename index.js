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
const bot = new Bottr.Bot();
bot.use(new BottrApp())
bot.listen()

const {
    fragebogenprogrammierung,
    skalen
} = require('./fragebogenprogrammierung');

const welcomeMessage = 'Willkommen zum kurzen 10-Fragen-Test, welche Art von Entwickler du in Wirklichkeit bist! Kann es losgehen?';
const continueMessage = 'Willkommen zurück! Möchtest du die Befragung fortsetzen?';
const finishMessage = 'Danke für deine Teilnahme! Du hast die Befragung abgeschlossen und kannst jetzt die Ergebnisse deiner Kollegen hier einsehen!';

bot.on('message_received', function (message, session, next) {
    if (message.action === 'init') {
        db.findOne({
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
                        createUserContext(session, message);
                        context = session.getUserContext();
                    }
                }
                decideNextAction(session, context);
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

function decideNextAction(session, context) {
    switch (context.status) {
        case 'offen':
            session.send(welcomeMessage);
            break;
        case 'teilbefragt':
            session.send(continueMessage);
            break;
        case 'abgeschlossen':
            session.send(finishMessage);
            if (typeof context.resultImage === typeof undefined) {
                createPersonalResult(session, context);
            } else {
                session.send('Das kannst du dir gerne an die Wand hängen!', {
                    type: 'image.*',
                    url: context.resultImage
                });
            }
            break;
    }
}

function createPersonalResult(session, context) {
    imgcreator.createPersonalResult(context.results, fragebogenprogrammierung).then((img) => {
        img = 'data:image/png;base64,' + img;
        context.resultImage = img;
        updateUserContext(session, context);
        session.send('Das kannst du dir gerne an die Wand hängen!', {
            type: 'image.*',
            url: img
        });
    });
}

bot.hears([/start/i, /on/i, /kann losgehen/i, /\bja\b/i, /ja!/i, /jo/i, /yo/i, /yeah/i], function (message, session) {
    let context = session.getUserContext();
    if (context.step === -1) {
        startFB(session);
    } else {
        if (context.status === 'teilbefragt' || (context.status === 'offen' && context.step === 0)) {
            session.send('Es geht weiter!');
        }
        continueFB(session);
    }
});

bot.hears([/1/i, /2/i, /3/i, /4/i, /5/i, /6/i], function (message, session) {
    let context = session.getUserContext();
    if (context.step === -1) {
        session.send('Deine Nachricht macht an dieser Stelle noch keinen Sinn!');
    } else {
        if (context.step === 0) {
            context.status = 'teilbefragt';
        }
        context.results[fragebogenprogrammierung[context.step].id] = {
            wert: parseInt(message.text, 10)
        }
        context.step++;
        updateUserContext(session, context);
        continueFB(session);
    }
});

function sendRecognition(session) {
    session.send('Nächste Frage...');
}

function startFB(session) {
    session.send('Dann auf die Plätze...');
    session.send('...fertig...');
    session.send('...los!!!');
    if (typeof fragebogenprogrammierung[0].frage !== typeof undefined &&
        typeof fragebogenprogrammierung[0].skala !== typeof undefined &&
        typeof fragebogenprogrammierung[0].id !== typeof undefined &&
        typeof fragebogenprogrammierung[0].type !== typeof undefined) {
        let context = session.getUserContext();
        context.step = 0;
        updateUserContext(session, context);
        continueFB(session);
    }
}

function continueFB(session) {
    let context = session.getUserContext();
    if (context.step > fragebogenprogrammierung.length - 1) {
        finishFB(session);
    } else {
        if (context.step > 0) {
            sendRecognition(session);
        }
        switch (fragebogenprogrammierung[context.step].type) {
            case 'rating':
                sendRatingFrage(session, fragebogenprogrammierung[context.step]);
                break;
            case 'multi':
                sendMultiFrage(session, fragebogenprogrammierung[context.step]);
                break;
        }
    }

}

function finishFB(session) {
    let context = session.getUserContext();
    context.status = 'abgeschlossen';
    if (typeof context.resultImage === typeof undefined) {
        createPersonalResult(session, context);
    } else {
        session.send('Das kannst du dir gerne an die Wand hängen!', {
            type: 'image.*',
            url: context.resultImage
        });
    }
    updateUserContext(session, context);
    session.send(finishMessage);
}

function sendRatingFrage(session, frage) {
    var questionString = "";
    questionString += skalen[frage.skala.type].headline + '\n';
    questionString += skalen[frage.skala.type].einleitung +
        frage.skala.min + ' = ' + skalen[frage.skala.type].min +
        ' bis ' +
        frage.skala.max + ' = ' + skalen[frage.skala.type].max + '.\n';
    questionString += frage.frage;
    session.send(questionString);
}

function sendMultiFrage(session, frage) {
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
        default:
            break;
    }
    questionString += '\n' + frage.skala.text + '\nDeine nächste Nachricht wird als Antwort auf diese Frage gewertet!';
    session.updateUserContext({
        exclusive: receiveMultiFrage
    });
    session.send(questionString);
}

function receiveMultiFrage(message, session, next) {
    let context = session.getUserContext();
    if (context.step === -1) {
        session.send('Ups da hab ich mich wohl vertan. Ich hab dich leider nicht verstanden. Versuch es einfach nochmal')
    } else {
        if (context.step === 0) {
            context.status = 'teilbefragt';
        }
        let wert = {};
        let valid = false;
        let frage = fragebogenprogrammierung[context.step];
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
                var first = calcMultiTwo(frage, 'one', text);
                frage = first.frage;
                countone = first.count;
                wert.one = first.wert;
                var second = calcMultiTwo(frage, 'two', text);
                frage = second.frage;
                counttwo = second.count;
                wert.two = second.wert;
                wert.ergebnis = countone - counttwo;
                if (countone === 0 && counttwo === 0) {
                    session.send('Keine deiner Antworten haben gepasst versuch es noch einmal!');
                } else {
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
            updateUserContext(session, context);
            continueFB(session);
        }
    }
}

function calcMultiTwo(frage, index, text) {
    var array = frage.action[index];
    var count = 0;
    var wert = {}
    for (var prop in frage.action[index]) {
        for (var item in text) {
            if (Object.prototype.hasOwnProperty.call(text, item)) {
                if (checkIfWertEquals(text[item], frage.action[index][prop])) {
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

function checkIfWertEquals(wert, comp) {
    return (wert.trim().toLowerCase() === comp.trim().toLowerCase());
}

function createUserContext(session, message) {
    let user = {
        _id: message.id,
        results: {

        },
        status: 'offen',
        step: -1
    };
    session.updateUserContext(user);
    db.insert(user);
}

function updateUserContext(session, data) {
    let context = session.getUserContext();
    db.update({
        _id: context._id
    }, data, {}, function (err, numReplaced) {
        if (err && err !== null) {
            session.send('Leider hat das nicht so ganz funktioniert. Lade bitte die Seite neu!');
        }
    });
    session.updateUserContext(data);
}

module.exports = {
    db,
    bot,
    fragebogenprogrammierung,
    skalen,
    welcomeMessage,
    continueMessage,
    finishMessage,
    sendRecognition,
    startFB,
    continueFB,
    finishFB,
    sendRatingFrage,
    sendMultiFrage,
    receiveMultiFrage,
    createUserContext,
    updateUserContext
}