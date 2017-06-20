const Bot = require('./bot');
const WebsocketClient = require('./websocket-client');

class Server {
  constructor() {
    this.namespaces = {};
  }
  use(namespaceOrBot, bot) {
    if (bot) {
      this.namespaces[namespaceOrBot] = bot;
    } else {
      this.namespaces['/'] = namespaceOrBot;
    }
  }

  listen(port) {
    const app = require('express')();
    const server = require('http').Server(app);
    const io = require('socket.io')(server);

    server.listen(port);

    for (const path in this.namespaces) {
      const bot = this.namespaces[path];
      bot.use(new WebsocketClient(io.of(path)));
      app.use(path, bot.router);
    }

    return server;
  }
}

module.exports = Server;
