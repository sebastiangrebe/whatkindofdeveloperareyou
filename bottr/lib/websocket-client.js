const Session = require('./session');

function WebsocketClient(io) {
  return (bot) => {
    this.bot = bot;
    io.on('connection', this.createConnectionHandler());
    return this;
  };
}

WebsocketClient.prototype.createConnectionHandler = function () {
  return (socket) => {
    socket.on('message', this.createMessageHandler(socket));
  };
};

WebsocketClient.prototype.createMessageHandler = function (socket) {
  return (data) => {
    var session = new Session(data.user, this);
    session.socket = socket;

    this.bot.trigger('message_received', data, session);

    return session;
  };
};

WebsocketClient.prototype.send = function (session, text, attachment) {
  let message = {};

  if (text) {
    message.text = text;
  }

  if (attachment) {
    message.attachment = {
      type: attachment.type,
      url: attachment.url,
    };
  }

  session.socket.emit('message', message);
};

WebsocketClient.prototype.startTyping = function (session) {
  session.socket.emit('typing', {});
};

module.exports = WebsocketClient;
