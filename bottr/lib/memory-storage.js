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
      session.getUserContext = function (defaults) {
        const context = this.memory.users[session.user] || {};
        return Object.assign({}, defaults || {}, context);
      }.bind(this);

      session.getConversationContext = function (defaults) {
        const context = this.memory.conversations[session.conversation] || {};
        return Object.assign({}, defaults || {}, context);
      }.bind(this);

      session.getAccountContext = function (defaults) {
        const context = this.memory.accounts[session.account] || {};
        return Object.assign({}, defaults || {}, context);
      }.bind(this);

      session.updateUserContext = function (newValues) {
        const context = this.memory.users[session.user] || {};
        this.memory.users[session.user] = Object.assign(context, newValues);
      }.bind(this);

      session.updateConversationContext = function (newValues) {
        const context = this.memory.conversations[session.conversation] || {};
        this.memory.conversations[session.conversation] = Object.assign(context, newValues);
      }.bind(this);

      session.updateAccountContext = function (newValues) {
        const context = this.memory.accounts[session.account] || {};
        this.memory.accounts[session.account] = Object.assign(context, newValues);
      }.bind(this);

      next();
    });
    return this;
  }.bind(this);
}

module.exports = MemoryStorage;
