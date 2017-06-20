function MemoryStorage() {
  this.memory = {
    users: {

    },
    conversations: {

    },
    accounts: {

    },
  };

  return function init(bot) {
    bot.on('message_received', (message, session, next) => {
      session.setGetUserContext((defaults) => {
        const context = this.memory.users[session.user] || {};
        return Object.assign({}, defaults || {}, context);
      });
      session.setUpdateUserContext((newValues) => {
        const context = this.memory.users[session.user] || {};
        this.memory.users[session.user] = Object.assign(context, newValues);
      });
      next();
    });
    return this;
  }.bind(this);
}

module.exports = MemoryStorage;
