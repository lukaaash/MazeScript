/// <reference path="../N4/N4.ts" />
/// <reference path="../common/maze.ts" />
/// <reference path="../common/global.ts" />
/// <reference path="maze.ts" />

class World implements IGlobal {

    private _game: N4.Game;
    private _timeDelta: number;
    private _maze: Maze;
    private _onready: Function;
    private _ready: boolean;

    private requestId: number;
    private requests: Object;

    private _players: Dictionary<number, Player>;

    get players(): Dictionary<number, Player> {
        return this._players;
    }

    get game(): N4.Game {
        return this._game;
    }

    get time(): number {
        return this._game.time + this._timeDelta;
    }

    get maze(): Maze {
        return this._maze;
    }

    //TODO: make this protected
    set maze(value: Maze) {
        this._maze = value;
    }

    get onready(): Function {
        return this._onready;
    }

    set onready(value: Function) {
        if (typeof value !== 'function') {
            console.error('Not a function');
        }

        this._onready = value;
    }

    init() {
        this.send(0);
    }

    sync() {
        this.send(1, [this.time]);
    }

    playerCreate(player: LocalPlayer, options: PlayerOptions) {
        var requestId = ++this.requestId;
        this.requests[requestId] = player;
        var data = [requestId, options];
        this.send(4, data);
    }

    playerMove(data: Array<any>) {
        this.send(5, data);
    }

    send(command: number, data?: Array<any>) {
        console.error("Server is an abstract class - use LocalServer or RemoteServer");
    }

    process(command: number, data: Array<any>) {
        switch (command) {
            default:
                console.log('<- ', command, data);
                break;

            case 100:
                var version = data[0];
                var clientId = data[1];
                var serverTime = data[2];
                var localTime = this.time;
                console.log("<- REPLY_INIT", "version", version, "client_id", clientId, "server_time", serverTime);

                this._timeDelta = serverTime - localTime;
                this.sync();
                break;

            case 101:
                var t0 = data[0]; // client's time of request packet transmission
                var t1 = data[1]; // server's time of request packet reception
                var t2 = data[2]; // server's time of response packet transmission
                var t3 = this.time; // client's time of response packet reception
                var delay = (t3 - t0) - (t2 - t1);
                var offset = ((t1 - t0) + (t2 - t3)) / 2.0;
                this._timeDelta += offset;
                console.log("<- TIME", "delay", delay, "offset", offset, "delta", this._timeDelta);
                //console.log(t0, t1, t2, t3);

                if (!this._ready) {
                    this._ready = true;
                    this._onready(new N4.Success(this));
                }
                break;

            case 104:
                var requestId = data[0];
                var playerId = data[1];
                console.log("<- PLAYER_ID", "request_id", requestId, "player_id", playerId);

                var player = <LocalPlayer>this.requests[requestId];
                delete this.requests[requestId];
                player.onactivate(playerId);
                this._players.add(playerId, player);

                //TODO: make it possible for the server to deny player create requests
                break;
        }
    }


    constructor(game: N4.Game) {
        this._game = game;
        this._timeDelta = 0;
        this._maze = null;
        this._onready = function (e) { };
        this._ready = false;

        this.requestId = 0;
        this.requests = {};

        this._players = new Dictionary<number, Player>();
    }
}

var world: World = null;

class LocalWorld extends World {

    private worker: Worker;
    private supportsTransferables;

    constructor(game: N4.Game) {
        super(game);

        this.maze = new Maze2(64, 48);

        this.worker = new Worker("code/server/worker.js");

        this.supportsTransferables = null;

        this.worker.addEventListener('message', e => {
            var data = e.data;
            var command = data['command'];

            if (typeof command !== 'number' || !Array.isArray(data))
                console.error('[client] Invalid message');
            else
                this.process(command, data);
        }, false);

        this.init();
    }

    send(command: number, data?: Array<any>) {

        if (!(data != null))
            data = [];

        //var json = JSON.stringify(data);
        //console.log("->", command, json);

        data['command'] = command;

        this.worker.postMessage(data);

        /*
        var transferables = this.supportsTransferables;

        if (transferables == true) {
            this.worker.postMessage(data, [data]);
        } else if (transferables == false) {
            this.worker.postMessage(data);
        } else {
            this.worker.postMessage(data, [data]);
            if (typeof data.length === 'undefined') {
                this.supportsTransferables = true;
            } else {
                this.supportsTransferables = false;
            }
        }
        */
    }

}

class RemoteWorld extends World {

    private socket: WebSocket;

    send(command: number, packet?: any) {

        var message = [command, this.time];
        if (packet != null)
            message.push(packet);

        var json = JSON.stringify(message);
        console.log("->", json);
        this.socket.send(json);
    }

    constructor(game: N4.Game) {
        super(game);

        this.socket = null;

        this.game.loadText('/start', e => {
            if (e['success']) {

                var info = JSON.parse(e.text);

                var url = <string>info['url'];

                var loc = window.location
                var scheme: string;
                if (loc.protocol === "https:") {
                    scheme = "wss://";
                } else {
                    scheme = "ws://";
                }
                url = scheme + loc.host + url;

                this.socket = new WebSocket(url, 'maze');

                this.socket.onopen = (e) => {

                    this.sync();

                    if (typeof this.onready == 'function') {
                        this.onready(e);
                    }
                };

                this.socket.onmessage = (e: MessageEvent) => {
                    //alert(e.data);
                };

                this.socket.onclose = (e) => {
                    //var a : CloseEvent;
                    //wasClean;
                    //reason
                    alert('disconnected: ' + e.code);
                };

            } else {
                alert(e['message']);
            }
        });
    }


}
