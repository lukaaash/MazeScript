/// <reference path="../common/common.ts" />
/// <reference path="../common/player.ts" />
/// <reference path="../common/avatar.ts" />
/// <reference path="client.ts" />

class ServerAvatar extends Avatar {

    private _client: Client;

    get client(): Client {
        return this._client;
    }

    constructor(client: Client, id: number, options: PlayerOptions) {
        super(id, options);

        this._client = client;
    }

} 