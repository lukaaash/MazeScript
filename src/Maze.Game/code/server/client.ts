class Client {

    private _id: number;
    private _initialized: boolean;

    get id() {
        return this._id;
    }

    get initialized() {
        return this._initialized;
    }

    setId(id: number) {
        this._id = id;
    }

    initialize() {
        this._initialized = true;
    }

    constructor() {
        this._id = 0;
        this._initialized = false;
    }

    send(packet: any) {
        console.error("Method not implemented.");
    }

    fail(message: string) {
        console.error("Method not implemented.");
    }

}