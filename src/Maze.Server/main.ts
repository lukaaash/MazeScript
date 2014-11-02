/// <reference path="../../third_party/typings/node.d.ts" />

var ws = require("ws");
var maze = require("./server.js");

var WebSocketServer = ws.Server;

var port = process.env.port || 1337;

var wss = new WebSocketServer({
    port: port
});

wss.on('connection', function (ws) {

    /*
    var send = ws.send;

    ws.send = function (data) {
        send.call(ws, data, function (error) {
            console.log("Error while sending: %s", error);
        });
    };
    */

    maze.accept(ws);

    /*
    ws.on('message', function (message) {
        console.log('received: %s', message);
    });

    ws.on('close', function () {
        console.log('disconnected');
    });

    ws.send('something', function (error) {
        console.log('error while sending: %s', error);
    });
    */
});
