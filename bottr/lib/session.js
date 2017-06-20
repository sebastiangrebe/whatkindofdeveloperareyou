const queue = require('queue');

class Session {
  constructor(bot, user, client) {
    this.bot = bot;
    this.queue = queue();
    this.queue.concurrency = 1;


    this.exclusive = false;
    this.user = user;
    this.client = client;
  }

  send(text, attachment) {
    const session = this;

    this.queue.push((cb) => {
      session.startTyping();

      let typingTime = 0;

      if (text) {
        const averageWordsPerMinute = 600;
        const averageWordsPerSecond = averageWordsPerMinute / 60;
        const averageWordsPerMillisecond = averageWordsPerSecond / 1000;
        const totalWords = text.split(' ').length;
        typingTime = (totalWords / averageWordsPerMillisecond);
      }
      setTimeout(() => {
        session.client.send(session, text, attachment);
        cb();
      }, typingTime);
    });

    this.queue.start();
  }

  startTyping() {
    this.client.startTyping(this);
  }

  startTopic(topicID) {
    this.updateUserContext({
      currentTopic: topicID,
    });
  }

  finishTopic() {
    this.updateUserContext({
      currentTopic: undefined,
    });
  }

  getUserContext(defaults) {
    const context = this.bot.memory.users[this.user] || {};
    return Object.assign({}, defaults || {}, context);
  }

  updateUserContext(newValues) {
    if (typeof this.bot.memory.users[this.user] === typeof undefined) {
      this.bot.memory.users[this.user] = newValues;
    } else {
      const context = this.bot.memory.users[this.user] || {};
      this.bot.memory.users[this.user] = Object.assign(context, newValues);
    }
  }

  setUpdateUserContext(call) {
    this.updateUserContext = call;
  }

  setGetUserContext(call) {
    this.updateUserContext = call;
  }
}
module.exports = Session;
