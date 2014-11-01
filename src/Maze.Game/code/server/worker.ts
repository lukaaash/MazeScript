/// <reference path="server.ts" />

if (typeof importScripts === 'function') {
    importScripts('../common/dictionary.js');
    importScripts('../common/maze.js');
    importScripts('../common/global.js');
    importScripts('../common/player.js');
    importScripts('../common/avatar.js');   
    importScripts('../common/protocol.js');   
    importScripts('server.js');
    importScripts('client.js');
}

interface IWorkerSelf {
    postMessage(message: any): void;
    //addEventListener(type: string, listener: EventListener, useCapture?: boolean): void;
    onmessage: (ev: MessageEvent) => any;
    close(): void;
}

class WorkerServer extends Server {
    private worker: IWorkerSelf;

    format(command: number, data?: Array<any>) {
        if (!(data != null))
            data = [];

        if (!Array.isArray(data)) {
            console.error('[server] Invalid data');
            return;
        }

        data['command'] = command;

        return data;
    }

    constructor() {
        super();

        this.worker = <IWorkerSelf><any>self;

        var client = new WorkerClient(this.worker);

        this.accept(client);

        this.worker.onmessage = e => {
            var data = e.data;
            data.received = this.time;
            var command = data['command'];
            if (typeof command !== 'number')
                console.error('[server] Invalid command');
            else
                this.process(client, command, data);
        };
    }
}

class WorkerClient extends Client {

    private worker: IWorkerSelf;

    constructor(worker: IWorkerSelf) {
        super();
        this.worker = worker;
    }

    send(packet: any) {
        this.worker.postMessage(packet);
    }

    fail(message: string) {
        //this.send(13, [0, message]);
        this.worker.close();
    }
}

var server: Server = new WorkerServer();
var world: IWorld = server;




