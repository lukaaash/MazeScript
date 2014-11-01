/// <reference path="../common/common.ts" />
/// <reference path="../common/player.ts" />
/// <reference path="../common/avatar.ts" />
/// <reference path="../common/dictionary.ts" />
/// <reference path="../common/protocol.ts" />
/// <reference path="client.ts" />

class Server implements IWorld {

    private version: number;

    private _maze: Maze;

    private _clients: Dictionary<number, Client>;
    private _nextClientId: number;

    private _players: Dictionary<number, Player>;
    private _nextPlayerId: number;

    get time(): number {
        return performance.now();
    }

    get maze(): Maze {
        return this._maze;
    }

    get clients(): Dictionary<number, Client> {
        return this._clients;
    }

    get players(): Dictionary<number, Player> {
        return this._players;
    }

    constructor() {
        this.version = 1;

        this._maze = new Maze(64, 48);

        this._clients = new Dictionary<number, Client>();
        this._nextClientId = 1;

        this._players = new Dictionary<number, Player>();
        this._nextPlayerId = 1;

        setInterval(() => this.tick(), 50);
    }

    tick() {
        var t = this.time;
        this._players.forEach((player, playerId) => {
            player.onmove(t);
        });
    }

    accept(client: Client) {
        var clientId = this._nextClientId++;
        client.setId(clientId);
        this._clients.add(clientId, client);
    }

    // rename to 'encode' and add 'decode' as well
    format(command: number, data?: Array<any>) {
        console.error("Method not implemented.");
    }

    send(client: Client, command: number, data?: Array<any>) {
        var packet = this.format(command, data);
        client.send(packet);
    }

    sendExcept(client: Client, command: number, data?: Array<any>) {
        var packet = this.format(command, data);

        this._clients.forEach(peer => {
            if (peer == client)
                return;

            peer.send(packet)
        });
    }

    //TODO: make this accept 'packet' instead of command/data to make it possible to forward commands without having to re-encode them
    process(client: Client, command: number, data: any) {

        var reply = command + 100;

        switch (command) {
            default:
                console.log('->', command, JSON.stringify(data), data['received']);
                break;
            case 0:
                console.log("-> INIT");
                if (client.initialized) {
                    client.fail("Received duplicate INIT message.");
                    return;
                }

                this.send(client, reply, [this.version, client.id, this.time]);
                client.initialize();
                break;
            case 1:
                var t0 = data[0];
                console.log("-> SYNC", 'client_time', t0);
                this.send(client, reply, [t0, data['received'], this.time]);
                break;

            case 4:
                var requestId = <number>data[0];
                var playerOptions = <PlayerOptions>data[1];
                console.log("-> CREATE_PLAYER", 'request_id', requestId, 'options', playerOptions);

                var playerId = this._nextPlayerId++;
                var player = new Avatar(playerId, playerOptions);
                this._players.add(playerId, player);

                this.send(client, reply, [requestId, playerId]);
                this.sendExcept(client, CREATE_AVATAR, [playerId, playerOptions]);
                break;

            case 5:
                var decisionTime = <number>data[0];
                var playerId = <number>data[1];
                var fromTime = <number>data[2];
                var moves = <Array<number>>data[3];
                console.log("-> MOVE_PLAYER", 'player_id', playerId, 'from_time', decisionTime + "+" + fromTime, 'moves', JSON.stringify(moves));

                //TODO: detect lags

                //TODO: make sure that (fromTime >= previousFromTime)
                fromTime += decisionTime;

                var player = <Avatar>this._players.getItem(playerId);
                if (!(player != null)) {
                    client.fail("Received command for nonexistent player.");
                    return;
                }

                player._move(decisionTime, fromTime, moves);

                this.sendExcept(client, MOVE_PLAYER, data);
                break;


        }
    }
}


