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
      session.getUserContext = (defaults) => {
        const context = this.memory.users[session.user] || {};
        return Object.assign({}, defaults || {}, context);
      };

      session.getConversationContext = (defaults) => {
        const context = this.memory.conversations[session.conversation] || {};
        return Object.assign({}, defaults || {}, context);
      };

      session.getAccountContext = (defaults) => {
        const context = this.memory.accounts[session.account] || {};
        return Object.assign({}, defaults || {}, context);
      };

      session.updateUserContext = (newValues) => {
        const context = this.memory.users[session.user] || {};
        this.memory.users[session.user] = Object.assign(context, newValues);
      };

      session.updateConversationContext = (newValues) => {
        const context = this.memory.conversations[session.conversation] || {};
        this.memory.conversations[session.conversation] = Object.assign(context, newValues);
      };

      session.updateAccountContext = (newValues) => {
        const context = this.memory.accounts[session.account] || {};
        this.memory.accounts[session.account] = Object.assign(context, newValues);
      };

      next();
    });
    return this;
  }.bind(this);
}

module.exports = MemoryStorage;
