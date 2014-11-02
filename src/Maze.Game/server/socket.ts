/// <reference path="server.ts" />


class WebSocketServer extends Server {

    constructor() {
        super();
    }

    format(command: number, data?: Array<any>) {
        if (!(data != null))
            data = [];

        command |= 0;

        if (!Array.isArray(data)) {
            console.error('[server] Invalid data');
            return;
        }

        return JSON.stringify([command, data]);
    }

    handle(socket: WebSocket) {

        var client = new WebSocketClient(socket);

        this.accept(client);

        socket.onclose = e => {
            console.log("WebSocket closed: ", e.code);

            this.abandon(client);
        };

        socket.onerror = e => {
            console.log("WebSocket error: ", e);

            this.abandon(client);
        };

        socket.onmessage = (e: MessageEvent) => {
            var received = performance.now();
            var json = e.data;

            var packet = <Array<any>>JSON.parse(json);
            var command = packet[0] | 0;
            var data = packet[1];

            if (data != null)
                data['received'] = received;

            this.process(client, command, data);
        };
    }

}

class WebSocketClient extends Client {

    private socket: WebSocket;

    constructor(socket: WebSocket) {
        super();
        this.socket = socket;
    }

    send(packet: any) {
        //console.log("Sending", packet);
        try {
            this.socket.send(packet);
        } catch (e) {
            console.warn("Caught error: ", e);
            var event = <CloseEvent>{
                wasClean: true,
                reason: '',
                code: 1002,
            }
            this.socket.onclose(event);
        }
    }

    fail(message: string) {
        //this.send(this.format(13, [0, message]));
        this.socket.close(1002); // 1002 = protocol error
    }
}

var server: Server = new WebSocketServer();
var world: IWorld = server;



 