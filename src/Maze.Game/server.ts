/// <reference path="code/server/server.ts" />
/// <reference path="code/server/socket.ts" />

declare var module: any;

module.exports = {

    accept: function (socket: WebSocket) {
        (<WebSocketServer>server).handle(socket);
    },

    info: function () {
        console.log("TODO");
    }
};

