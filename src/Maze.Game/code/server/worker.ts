/// <reference path="server.ts" />

if (typeof importScripts === 'function') {
    importScripts('../common/dictionary.js');
    importScripts('../common/maze.js');
    importScripts('../common/global.js');
    importScripts('../common/player.js');
    importScripts('../common/avatar.js');
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
    private client: Client;

    constructor() {
        super();

        this.worker = <IWorkerSelf><any>self;

        this.client = new WorkerClient(this.worker);

        this.worker.onmessage = e => {
            var data = e.data;
            data.received = this.time;
            var command = data['command'];
            if (typeof command !== 'number')
                console.error('[server] Invalid command');
            else
                this.process(this.client, command, data);
        };
    }
}

class WorkerClient extends Client {

    private worker: IWorkerSelf;

    constructor(worker: IWorkerSelf) {
        super();
        this.worker = worker;
    }

    send(command: number, data?: Array<any>) {
        if (!(data != null))
            data = [];

        if (!Array.isArray(data)) {
            console.error('[server] Invalid data');
            return;
        }

        data['command'] = command;

        this.worker.postMessage(data);
    }

    fail(message: string) {
        this.send(13, [0, message]);
        this.worker.close();
    }
}

global = server = new WorkerServer();



