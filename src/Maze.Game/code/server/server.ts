/// <reference path="../common/global.ts" />
/// <reference path="../common/player.ts" />
/// <reference path="../common/avatar.ts" />
/// <reference path="client.ts" />

class Server implements IGlobal {

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
    }

    process(client: Client, command: number, data: any) {

        var reply = command + 100;

        switch (command) {
            default:
                console.log('->', command, JSON.stringify(data), data['received']);
                break;
            case 0:
                console.log("-> INIT");
                if (client.id != 0) {
                    client.fail("Received duplicate INIT message.");
                    return;
                }

                var clientId = this._nextClientId++;
                client.setId(clientId);
                this._clients.add(clientId, client);

                client.send(reply, [this.version, clientId, this.time]);
                break;
            case 1:
                var t0 = data[0];
                console.log("-> SYNC", 'client_time', t0);
                client.send(reply, [t0, data['received'], this.time]);
                break;

            case 4:
                var requestId = <number>data[0];
                var playerOptions = <PlayerOptions>data[1];
                console.log("-> CREATE_PLAYER", 'request_id', requestId, 'options', playerOptions);

                var playerId = this._nextPlayerId++;
                var player = new Avatar(playerId, playerOptions);
                this._players.add(playerId, player);

                client.send(reply, [requestId, playerId]);
                break;

            case 5:
                var decisionTime = <number>data[0];
                var playerId = <number>data[1];
                var fromTime = <number>data[2];
                var moves = <Array<number>>data[3];
                console.log("-> MOVE_PLAYER", 'player_id', playerId, 'from_time', decisionTime + "+" + fromTime, 'moves', JSON.stringify(moves));

                //TODO: make sure that (fromTime >= previousFromTime)
                fromTime += decisionTime;

                var player = <Avatar>this._players.getItem(playerId);
                if (!(player != null)) {
                    client.fail("Received command for nonexistent player.");
                    return;
                }

                player._move(decisionTime, fromTime, moves);

                break;


        }
    }

}

var server: Server = null;
