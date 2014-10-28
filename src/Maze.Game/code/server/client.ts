class Client {

    private _id: number;

    get id() {
        return this._id;
    }

    setId(id: number) {
        this._id = id;
    }

    constructor() {
        this._id = 0;
    }

    send(command: number, data: any) {
        console.error("Method not implemented.");
    }

    fail(message: string) {
        console.error("Method not implemented.");
    }

}