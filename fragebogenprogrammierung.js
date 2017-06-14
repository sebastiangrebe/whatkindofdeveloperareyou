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
    },
    wichtigkeiten: {

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
}]; // TODO

const fragebogenprogrammierung = [{
        id: "F1",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'zustimmung'
        },
        frage: 'Ich bin sehr organisiert bei meiner Arbeit.'
    },
    {
        id: "F2",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'zustimmung'
        },
        frage: 'Ich verstehe komplexe logische Aufgaben sehr gut und schnell.'
    },
    {
        id: "F3",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'zustimmung'
        },
        frage: 'Ich bin sehr kreativ und denke immer an den Endnutzer bei meiner Arbeit.'
    },
    {
        id: "F4",
        type: 'rating',
        skala: {
            min: 1,
            max: 6,
            type: 'zustimmung'
        },
        frage: 'Ich bin in meiner Arbeit sehr organisiert.'
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
        frage: 'Welches der folgender Sachen ist dir am wichtigsten bei deiner Arbeit?'
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
    }
];

module.exports = {
    fragebogenprogrammierung,
    skalen
}