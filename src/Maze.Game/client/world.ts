/// <reference path="../ngles/all.ts" />
/// <reference path="../common/maze.ts" />
/// <reference path="../common/world.ts" />
/// <reference path="../common/protocol.ts" />
/// <reference path="../common/avatar.ts" />
/// <reference path="maze.ts" />

interface IWorld {
    playerCreate? (player: LocalPlayer, options: PlayerOptions): void;
    playerMove? (packet: Array<any>): void;
    onready?: Function;
    sync? (): void;
    setMazeTile? (x: number, y: number, wall: number): void;
}


class World implements IWorld {

    private _game: N4.Game;
    private _sprites: Sprites;

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

    setMazeTile(x: number, y: number, wall: number) {
        if (this.maze.set(x, y, wall)) {
            this.send(SET_TILE, [x, y, wall]);
        }
    }

    init() {
        this.send(INIT);
    }

    getWorld() {
        console.log("!!!------------------------------");
        this.send(GET_WORLD);
    }

    sync() {
        this.send(SYNC, [this.time]);
    }

    playerCreate(player: LocalPlayer, options: PlayerOptions) {
        var requestId = ++this.requestId;
        this.requests[requestId] = player;
        var data = [requestId, options];
        this.send(CREATE_PLAYER, data);
    }

    playerMove(data: Array<any>) {
        this.send(MOVE_PLAYER, data);
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
                console.log(t0, t1, t2, t3);

                if (!this._ready) {
                    this._ready = true;
                    this._onready(new N4.Success(this));

                    console.log("r343434343433");

                    this.getWorld();
                }

                break;

            case 104:
                var requestId = <number>data[0];
                var playerId = <number>data[1];
                console.log("<- PLAYER_ID", "request_id", requestId, "player_id", playerId);

                var player = <LocalPlayer>this.requests[requestId];
                delete this.requests[requestId];
                player.onactivate(playerId);
                this._players.add(playerId, player);

                //TODO: make it possible for the server to deny player create requests
                break;

            case CREATE_AVATAR:
                var playerId = <number>data[0];
                var playerOptions = <PlayerOptions>data[1];
                console.log("<- CREATE_AVATAR", "player_id", playerId, "options", playerOptions);

                var avatar = new LocalAvatar(this._sprites, playerId, playerOptions);
                this._players.add(playerId, avatar);
                break;

            case CREATE_MAZE:
                console.log("------------------------------");
                var maze = data[0];
                this._maze.deserialize(maze);
                break;

            case MOVE_PLAYER:
                var decisionTime = <number>data[0];
                var playerId = <number>data[1];
                var fromTime = <number>data[2];
                var moves = <Array<number>>data[3];
                console.log("-> MOVE_PLAYER", 'player_id', playerId, 'recv_time', world.time, 'from_time', decisionTime + "+" + fromTime, 'moves', JSON.stringify(moves));

                //TODO: detect lags

                //TODO: make sure that (fromTime >= previousFromTime)
                fromTime += decisionTime;

                var avatar = <LocalAvatar>this._players.getItem(playerId);
                if (!(avatar != null)) {
                    console.warn("Received command for nonexistent player.");
                    break;
                }

                avatar._move(decisionTime, fromTime, moves);
                break;
            
            case REMOVE_PLAYER:
                var playerId = <number>data[0];
                var avatar = <LocalAvatar>this._players.getItem(playerId);
                if (!(avatar != null)) {
                    console.warn("Received nonexistent player.");
                    break;
                }

                this._players.remove(playerId);
                break;

            case SET_TILE:
                var x = <number>data[0];
                var y = <number>data[1];
                var wall = <number>data[2];

                this._maze.set(x, y, wall);

                break;
        }
    }


    constructor(game: N4.Game, sprites: Sprites) {
        this._game = game;
        this._sprites = sprites;
        this._timeDelta = 0;
        this._maze = new Maze2(64, 48);
        this._onready = function (e) { };
        this._ready = false;

        this.requestId = 0;
        this.requests = {};

        this._players = new Dictionary<number, Player>();
    }
}

class LocalWorld extends World {

    private worker: Worker;
    private supportsTransferables;

    constructor(game: N4.Game, sprites: Sprites) {
        super(game, sprites);

        this.worker = new Worker("worker.js");

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

        data['command'] = command;

        this.worker.postMessage(data);
    }

}

class RemoteWorld extends World {

    private socket: WebSocket;

    constructor(game: N4.Game, sprites: Sprites, url: string) {
        super(game, sprites);

        this.socket = new WebSocket(url, 'maze');

        this.socket.onopen = (e) => {
            this.init();
        };

        this.socket.onmessage = (e: MessageEvent) => {
            var json = e.data;

            var packet = <Array<any>>JSON.parse(json);
            var command = packet[0] | 0;
            var data = packet[1];

            this.process(command, data);
        };

        this.socket.onclose = (e) => {
            //var a : CloseEvent;
            //wasClean;
            //reason
            alert('disconnected: ' + e.code);
        };

    }

    send(command: number, data?: any) {
        command |= 0;
        var json = JSON.stringify([command, data]);
        console.log("->", json);
        this.socket.send(json);
    }


}
