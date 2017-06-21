const skalen = {
    zustimmung: {
        max: 'stimme überhaupt nicht zu',
        min: 'stimme voll und ganz zu',
        headline: 'Inwieweit stimmst du der folgenden Aussage zu?',
        einleitung: 'Bewerte von '
    },
    trifft: {
        max: 'trifft überhaupt nicht zu',
        min: 'trifft voll und ganz zu',
        headline: 'Inwieweit trifft die folgende Aussage zu?',
        einleitung: 'Bewerte von '
    }
};

const backend_languages = ["NET", "PHP", "C#", "VB", "Ruby", "Perl", "NodeJS", "Actionscript", "Erlang", "Elixir", "Go", "SQL", "C++", "Rust", "Java", "Swift"];
const frontend_languages = ["JavaScript", "CSS", "VBScript", "Silverlight", "HTML", "jQuery", "angular", "react", "ember"];
const topics = [{
    text: "Skalierbarkeit",
    wert: -1
}, {
    text: "Sicherheit",
    wert: -1
}, {
    text: "User Experience",
    wert: 1
}, {
    text: "Kurze Ladezeiten",
    wert: 1
}, {
    text: "Cross-Platform Support",
    wert: 1
}];
const percs = [{
    text: "Musik hören",
    wert: -1
},{
    text: "Unbegrenzt Kaffee",
    wert: -1
},{
    text: "Frische Getränke und was gesundes in der Küche",
    wert: 1
},{
    text: "Life Coaching",
    wert: 1
},{
    text: "Sportmaßnahmen",
    wert: -1
},{
    text: "Geselliger Bier-Freitag",
    wert: 1
}];

const profileActions = [{
        command: "change profile",
        parameter: "pic"
    },
    {
        command: "change profile",
        parameter: "name"
    }
];

const fragebogenprogrammierung = [{
        id: "F1",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'trifft'
        },
        frage: 'Ich bin sehr organisiert bei meiner Arbeit.'
    },
    {
        id: "F2",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'trifft'
        },
        frage: 'Ich verstehe komplexe logische Aufgaben sehr gut und schnell.'
    },
    {
        id: "F3",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'trifft'
        },
        frage: 'Ich verlasse mich gerne auf bereits erprobte Techniken und achte extrem auf die Stabitlität meiner Anwendung.'
    },
    {
        id: "F4",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'zustimmung'
        },
        frage: 'Ich finde regelmäßige Code Reviews sehr wichtig.'
    },
    {
        id: "F5",
        type: 'multi',
        skala: {
            text: 'Gib einfach die Zahl für das passende Element ein.'
        },
        action: {
            type: 'one',
            one: topics
        },
        frage: 'Welches der folgenden Sachen ist dir am wichtigsten bei deiner Arbeit?'
    },
    {
        id: "F6",
        type: 'multi',
        skala: {
            text: 'Gib deine Nachricht einfach als kommaseparierte Liste ein.'
        },
        action: {
            type: 'two',
            one: backend_languages,
            two: frontend_languages
        },
        frage: 'Welche Programmiersprachen verwendest du am liebsten?'
    },
    {
        id: "F7",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'zustimmung'
        },
        frage: 'Unit Testing ist essentiell für stets gute Qualität meiner Arbeit.'
    },
    {
        id: "F8",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'trifft'
        },
        frage: 'Die Effizienz meines Codes ist einer meiner höchsten Prioritäten.'
    },
    {
        id: "F9",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'trifft'
        },
        frage: 'Ich hole mir regelmäßig Feedback von meinen Kollegen ein.'
    },
    {
        id: "F10",
        type: 'multi',
        skala: {
            text: 'Gib einfach die Zahl für das passende Element ein.'
        },
        action: {
            type: 'one',
            one: percs
        },
        frage: 'Was sind die wichtigsten Perks für dich bei der Arbeit?'
    }
];

const welcomeMessage = 'Willkommen zum kurzen 10-Fragen-Test, welche Art von Entwickler du in Wirklichkeit bist! Kann es losgehen?';
const continueMessage = 'Willkommen zurück! Möchtest du die Befragung fortsetzen?';
const finishMessage = 'Danke für deine Teilnahme! Du hast die Befragung abgeschlossen und kannst jetzt die Ergebnisse deiner Kollegen hier einsehen!';

module.exports = {
    fragebogenprogrammierung,
    skalen,
    profileActions,
    welcomeMessage,
    continueMessage,
    finishMessage
};