class SurveyBot {
    constructor(props) {
        for (let prop in props) {
            if (props.hasOwnProperty(prop)) {
                this[prop] = props[prop];
            }
        }

        // Check if all required parameters are passed
        const checkRequired = ['bot', 'imgcreator', 'fragebogenprogrammierung', 'skalen', 'profileActions', 'welcomeMessage', 'continueMessage', 'finishMessage', 'db'];
        for (let prop in checkRequired) {
            if (checkRequired.hasOwnProperty(prop)) {
                if (!this.hasOwnProperty(checkRequired[prop])) {
                    throw new Error("The required fields are missing");
                }
            }
        }

        this.bindContext = this.bindContext.bind(this);
        this.bindContext();
        this.createReceivers();
    }

    // Binds the current context to all functions where needed
    bindContext() {
        this.receiveMultiFrage = this.receiveMultiFrage.bind(this);
        this.receiveProfilePic = this.receiveProfilePic.bind(this);
        this.receiveProfileName = this.receiveProfileName.bind(this);
        this.createGlobalResultReceiver = this.createGlobalResultReceiver.bind(this);
    }

    // Create the receivers which will receive all messages and handle them
    createReceivers() {
        this.createMessageReceiver();
        this.createYesReceiver();
        this.createNumberReceiver();
        this.createProfileCommandReceiver();
        this.createNavigationReceiver();
        this.createGlobalResultReceiver();
    }

    /*
     *  The general message receivers catches all requests and forwards them using next if it not the init message.
     *  Otherwise the message will either be forwarded to the exclusive action which is bind to the context or
     *  be just handled by the next receiver catching the message.
     */
    createMessageReceiver() {
        var self = this;
        this.bot.on('message_received', function (message, session, next) {
            // If first message
            if (message.action === 'init') {
                // Get the current user doc from the database
                self.db.findOne({
                    _id: message.id
                }, function (err, doc) {
                    if (!err) {
                        let context = session.getUserContext();
                        // If there was a doc then load the doc into the current open session
                        if (doc) {
                            doc.exclusive = false;
                            session.updateUserContext(doc);
                            context = doc;
                        } else {
                            // If there was no doc then create a new user inside the database
                            if (Object.keys(context).length === 0 || context._id !== message.id) {
                                self.createUserContext(session, message);
                                context = session.getUserContext();
                            }
                        }
                        // Go to the next action inside the survey
                        self.decideNextAction(session, context);
                    }
                })
            } else {
                let context = session.getUserContext();
                // If there is a exclusive function bind which ensures that this is the only receiver allowed the get the next message
                if (context.exclusive) {
                    context.exclusive(message, session, next);
                } else {
                    // Otherwise just forward
                    return next();
                }
            }
        });
    }

    /*
     *  This receiver listens on all messages using some kind of positive feedback meaning "confirm".
     *  This is only used for the start message currently and has no use inside the survey.
     */
    createYesReceiver() {
        var self = this;
        this.bot.hears([/\bstart\b/i, /\bo\bn/i, /\bkann losgehen\b/i, /\bja\b/i, /\bja!\b/i, /\bjo\b/i, /\byo\b/i, /\byeah\b/i], function (message, session) {
            let context = session.getUserContext();
            // Start survey if nothing was done yet
            if (context.step === -1) {
                self.startFB(session);
            } else {
                // Sends a special message for all user who have are already entered the survey but did not finish it
                if (context.status === 'teilbefragt' || (context.status === 'offen' && context.step === 0)) {
                    session.send('Es geht weiter!');
                }
                // Continue the survey
                self.continueFB(session);
            }
        });
    }

    /*
     *  This receiver catches all inputs which only consist of numbers. This is used for all kinde of questions inside the survey.
     *  It is not used for multi questions since they need a special handeling.
     */
    createNumberReceiver() {
        var self = this;
        this.bot.hears([/\b[0-9]+\b/], function (message, session) {
            let context = session.getUserContext();
            // Catch all messages of users who have not started the survey yet
            if (context.step === -1) {
                session.send('Deine Nachricht macht an dieser Stelle noch keinen Sinn!');
            } else {
                let wert = parseInt(message.text, 10);
                // Check if the given answer fits the scales of the rating question given here
                wert = self.checkRatingAnswer(self.fragebogenprogrammierung[context.step], wert);
                if (wert) {
                    // Set the status of the user to 'participant'/'teilbefragt'
                    if (context.step === 0) {
                        context.status = 'teilbefragt';
                    }
                    // Set the result inside the context save under the question id
                    context.results[self.fragebogenprogrammierung[context.step].id] = {
                        wert: wert
                    }
                    // Increase survey index for navigation
                    context.step++;
                    // Update the user inside the database
                    self.updateUserContext(session, context);
                    // Continue the survey
                    self.continueFB(session);
                } else {
                    session.send('Deine Antwort liegt nicht innerhalb der Skalen! Versuch es noch einmal.');
                }
            }
        });
    }

    /*
     *  This listener catches all commands/messages which have "change profile" inside.
     *  "change profile" is removed from the string and the leftover string is used to execute a specific function.
     */
    createProfileCommandReceiver() {
        var self = this;
        this.bot.hears([/change profile/i], function (message, session) {
            // Remove "change profile" and trim the leftover string
            var command = message.text.replace('change profile', "").trim();
            // If the leftover string matches one of the following string the matching function is executed using the exclusive property inside the context.
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
                default:
                    session.send('Ich hab dich nicht verstanden versuch es noch einmal!');
                    break;
            }
        });
    }

    /*
     *  This function creates two listeners for the navigation of the survey. On for forward one for backward.
     */
    createNavigationReceiver() {
        var self = this;
        this.bot.hears([/weiter/i], function (message, session) {
            let context = session.getUserContext();
            // Check if the user is able to navigate at all
            let status = self.checkStatus(context, session);
            if (status) {
                // Check if the direction of navigation is allowed currently
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
            // Check if the user is able to navigate at all
            let status = self.checkStatus(context, session);
            if (status) {
                // Check if the direction of navigation is allowed currently
                if (context.step > 0) {
                    context.step--;
                    self.updateUserContext(session, context);
                    self.continueFB(session);
                } else {
                    session.send('Du kannst nicht weiter zurück gehen.');
                }
            }
        });
    }

    /*
     *  This listener matches all messages asking for the global results
     */
    createGlobalResultReceiver() {
        var self = this;
        this.bot.hears([/get global results/i], function (message, session) {
            self.db.find({}, function (err, docs) {
                if (!err) {
                    self.imgcreator.createGlobalResults(docs, self.fragebogenprogrammierung).then((img) => {

                        img = 'data:image/png;base64,' + img;
                        session.send('Das sieht doch mal cool aus!', {
                            type: 'image.*',
                            url: img
                        });
                    });
                }
            });
        });
    }

    // This function check if navigation is allowed at all not specifying the direction of navigation
    checkStatus(context, session) {
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

    // This function expects a message including the new profile image to save
    receiveProfilePic(message, session, next) {
        // If text is included the message does not include a message - Currently images can only be sent alone
        if (typeof message.text !== typeof undefined) {
            session.send('Dein Bild muss als Datei und nicht als Text geschickt werden! Versuch es noch einmal.');
        } else {
            // If attachements are included take the first one - multiple profile images are not allowed
            if (typeof message.attachments !== typeof undefined && message.attachments.length) {
                let image = message.attachments[0];
                // Check if the attachment chosen is an image
                if (image.type.indexOf('image') !== -1) {
                    // Save the new profile image in the database as base64 string and reset the exclusive function
                    let context = session.getUserContext();
                    context.profile_pic = image;
                    context.exclusive = false;
                    this.updateUserContext(session, context);
                    session.send('Danke wir haben dein Bild gespeichert! Hier deine aktualisierten Ergebnisse!');
                    // Trigger a rebuild of the result image and send it to the user
                    this.createPersonalResult(session, context, true);
                } else {
                    session.send('Du musst eine Bild Datei schicken. Versuch es noch einmal.');
                }
            } else {
                session.send('Leider ist nichts angekommen. Versuch es noch einmal.');
            }
        }
    }

    // This function expects a simple text message which is used as the new profile name and is save to the database
    receiveProfileName(message, session, next) {
        if (typeof message.text !== typeof undefined) {
            let context = session.getUserContext();
            context.name = message.text;
            context.exclusive = false;
            this.updateUserContext(session, context);
            session.send('Danke wir haben deinen Namen gespeichert! Hier deine aktualisierten Ergebnisse!');
            this.createPersonalResult(session, context, true);
        } else {
            session.send('Du musst einen Text schicken. Versuch es noch einmal.');
        }
    }

    // Checks if the given value matches the scale of the given rating question
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

    // Based on the user's status the next action is initiated
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

    /*
     *  This function sends the result image to user.
     *  If the image has already been generated and the overwrite parameter is not defined then the already generated is send from the database.
     *  This saves the instance from generating the same image again.
     */
    createPersonalResult(session, context, overwrite) {
        var self = this;
        if (typeof context.resultImage === typeof undefined || (typeof overwrite !== typeof undefined && overwrite)) {
            // Call the imgcreator which has been passed to the constructor of this class to generate the personal result
            this.imgcreator.createPersonalResult(context, this.fragebogenprogrammierung).then((img) => {
                // Save the generated image as bas64 to the database and send it back to the user
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
            // Send the already generated image to the user
            session.send('Das kannst du dir gerne an die Wand hängen!', {
                type: 'image.*',
                url: context.resultImage
            });
            this.sendFurtherCommands(session, context);
        }
    }

    // Function sending a "next question" text
    sendRecognition(session) {
        session.send('Nächste Frage...');
    }

    // A function sending a short manual about the navigation commands and the starts with the first question if it has all required props
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

    // This is the main function triggered whenever the next question in order should be shown
    continueFB(session) {
        let context = session.getUserContext();
        // If continueFB is executed and the it was the last question execute finishFB
        if (context.step > this.fragebogenprogrammierung.length - 1) {
            this.finishFB(session);
        } else {
            // Whenever the user is already inside the survey send a recognition
            if (context.step > 0) {
                this.sendRecognition(session);
            }
            // Based on the type of the question a function is run
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

    // Sets the user to finished and disallowing him to navigate and only be receiving the current results
    finishFB(session) {
        let context = session.getUserContext();
        context.status = 'abgeschlossen';
        this.createPersonalResult(session, context);
        this.updateUserContext(session, context);
        session.send(this.finishMessage);
    }

    // Sends the current question in a human readable format
    sendRatingFrage(session, frage) {
        let questionString = "";
        questionString += this.skalen[frage.skala.type].headline + '\n';
        questionString += this.skalen[frage.skala.type].einleitung +
            frage.skala.min + ' = ' + this.skalen[frage.skala.type].min +
            ' bis ' +
            frage.skala.max + ' = ' + this.skalen[frage.skala.type].max + '.\n';
        questionString += frage.frage;
        session.send(questionString);
    }

    // Sends the current question in a human readable format
    sendMultiFrage(session, frage) {
        let questionString = frage.frage;
        switch (frage.action.type) {
            case 'one':
                // Creates a simple list with indexes starting from 1
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
        // Set the exclusive value to be sure that this function is the only one receiving the next message
        session.updateUserContext({
            exclusive: this.receiveMultiFrage
        });
        session.send(questionString);
    }

    // Receives the message meant as result for a multi question
    receiveMultiFrage(message, session, next) {
        let context = session.getUserContext();
        if (context.step === -1) {
            session.send('Ups da hab ich mich wohl vertan. Ich hab dich leider nicht verstanden. Versuch es einfach nochmal')
        } else {
            // Set the status of the user to 'participant'/'teilbefragt'
            if (context.step === 0) {
                context.status = 'teilbefragt';
            }
            let wert = {};
            let valid = false;
            var frage = this.fragebogenprogrammierung[context.step];
            // Based on the type of multi question a specific calculation is made
            switch (frage.action.type) {
                case 'one':
                    // Gets the given index subtracts 1 since the original array is zero based and takes the value from the question object
                    let selected = parseInt(message.text, 10) - 1;
                    if (selected >= 0 && selected < frage.action.one.length) {
                        wert = frage.action.one[selected].wert;
                        valid = true;
                    }
                    break;
                case 'two':
                    /* 
                     *  Expects a comma seperated list of items matching hopefully one of them inside the two passed arrays
                     *  Calculates from two lists to choose from which one of them received more answers in the entered list
                     *  The winning lists is interpreted as value of 1 or -1
                     */
                    wert.one = {};
                    wert.two = {};
                    let countone = 0;
                    let counttwo = 0;
                    let text = message.text.split(',');
                    let first = this.calcMultiTwo(frage, 'one', text);
                    countone = first.count;
                    wert.one = first.wert;
                    let second = this.calcMultiTwo(frage, 'two', text);
                    counttwo = second.count;
                    wert.two = second.wert;
                    wert.ergebnis = countone - counttwo;
                    if (countone !== 0 || counttwo !== 0) {
                        valid = true;
                    }
                    break;
            }
            // If the entered value is valid the result can be saved to the database including the original text entered
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

    /* 
     *  Calculates the result for a comma separated list and a give index of an string array
     *  It saves for each string inside the array if it has been entered, how many of them has been entered
     */
    calcMultiTwo(frage, index, text) {
        let array = frage.action[index];
        let count = 0;
        let wert = {};
        for (let prop in frage.action[index]) {
            if (frage.action[index].hasOwnProperty(prop)) {
                for (let item in text) {
                    if (text.hasOwnProperty(item)) {
                        if (this.checkIfWertEquals(text[item], frage.action[index][prop])) {
                            wert[frage.action[index][prop]] = 1;
                            count++;
                        } else {
                            wert[frage.action[index][prop]] = 0;
                        }
                    }
                }
            }
        }
        return {
            count,
            wert
        };
    }

    // Checks if a string equals another one
    checkIfWertEquals(wert, comp) {
        return (wert.trim().toLowerCase() === comp.trim().toLowerCase());
    }

    // Creates the intial user document inside the database
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

    // Updates the current user doc inside the database
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

    // Send a short manual of all further commands to edit your profile or receive the global results
    sendFurtherCommands(session, context) {
        let commandString = 'Du kannst die Art wie deine Ergebnisse anpassen. Hier die sehr kurze Kommandoliste:\n';
        for (let prop in this.profileActions) {
            if (this.profileActions.hasOwnProperty(prop)) {
                commandString += prop + ') ' + this.profileActions[prop].command + " " + this.profileActions[prop].parameter + '\n';
            }
        }
        commandString += 'Außerdem kannst du ganz einfach die allgemeinen Ergebnisse abrufen und siehst wie deine Kollegen abschneiden!\n Einfach "get global results" schicken.';
        session.send(commandString);
    }
}

module.exports = SurveyBot;