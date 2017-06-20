const BodyParser = require('body-parser');
const EventEmitter = require('./event-emitter');
const Express = require('express');
const ResponseMiddleware = require('./response-middleware');
const fs = require('fs');
const request = require('request');
const uuid = require('uuid');
const cors = require('cors');
const Topic = require('./topic');

const staticFilesDirectory = 'public';

class Bot {
  constructor(name) {
    this.name = name || 'bot';
    this.memory = {
      users: {

      },
    };

    this.topics = {};

    this.router = Express.Router();
    this.eventEmitter = new EventEmitter();
    this.rootTopic = new Topic();

    this.eventEmitter.addListener('message_received', (message, session) => {
      const context = session.getUserContext();
      let topic = this.rootTopic;

      if (context.currentTopic !== undefined) {
        topic = this.topics[context.currentTopic];
      }

      topic.trigger('message_received', message, session);
    });

    this.eventEmitter.fallback('webhook', (req, res) => {
      res.error('No webhook handlers configured');
    });

    this.router.use(`/${staticFilesDirectory}`, Express.static('public'));
    this.router.use(cors());
    this.router.use(BodyParser.urlencoded({
      extended: true,
    }));
    this.router.use(BodyParser.json());
    this.router.use(new ResponseMiddleware());

    this.router.get('/webhook', this.handleWebhookRequest.bind(this));
    this.router.post('/webhook', this.handleWebhookRequest.bind(this));

    this.eventEmitter.fallback('event', function (req, res) {
      res.error('No event handlers configured');
    });

    this.eventEmitter.fallback('webhook', function (req, res) {
      res.error('No webhook handlers configured');
    });

    this.router.use(('/' + staticFilesDirectory), Express.static('public'));
    this.router.use(cors());
    this.router.use(BodyParser.json());
    this.router.use(BodyParser.urlencoded({
      extended: true,
    }));
    this.router.use(new ResponseMiddleware());

    this.router.get('/webhook', this.handleWebhookRequest.bind(this));
    this.router.post('/webhook', this.handleWebhookRequest.bind(this));
    this.router.post('/event', this.handleEventRequest.bind(this));
  }

  handleEventRequest(req, res) {
    this.trigger('event', req, res);
  }

  handleWebhookRequest(req, res) {
    this.trigger('webhook', req, res);
  }

  trigger(eventName, ...args) {
    this.eventEmitter.emit(eventName, ...args);
  }

  // - Default to Topic -> RootTopic - Update code not to need this hack
  on(eventName, handler) {
    if (eventName === 'message_received') {
      this.rootTopic.on(eventName, handler);
    } else {
      this.eventEmitter.addListener(eventName, handler);
    }
  }

  hears(pattern, handler) {
    this.rootTopic.hears(pattern, handler);
  }

  use(component) {
    component(this);
  }
}

module.exports = Bot;
