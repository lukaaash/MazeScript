
class Dictionary<K, V> {
    private _values: Object;
    private _undefined: any;

    constructor() {
        this._values = {};
        this._undefined = this._values[42];
    }

    contains(key: K) {
        return this._values.hasOwnProperty(<string><any>key);
    }

    add(key: K, value: V) {
        if (this.contains(key))
            throw "Dictionary already contains the specified item.";

        this.setItem(key, value);
    }

    setItem(key: K, value: V) {
        this._values[<string><any>key] = value;
    }

    getItem(key: K) {
        if (!this.contains(key))
            return this._undefined;

        return this._values[<string><any>key];
    }

    findFirst(callback: (value: V, key: K, dictionary: Dictionary<K, V>) => boolean): V {
        for (var key in this._values) {
            if (!this._values.hasOwnProperty(<string><any>key))
                continue;

            var value = this._values[key];
            if (callback(value, key, this))
                return value;
        }

        return null;
    }

    forEach(callback: (value: V, key: K, dictionary: Dictionary<K, V>) => void): void {
        for (var key in this._values) {
            if (!this._values.hasOwnProperty(<string><any>key))
                continue;

            callback(this._values[key], key, this);
        }
    }


}