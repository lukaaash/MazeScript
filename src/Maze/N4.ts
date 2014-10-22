/// <reference path="common.ts" />
/// <reference path="game.ts" />
/// <reference path="buffer.ts" />
/// <reference path="texture.ts" />
/// <reference path="shader.ts" />
/// <reference path="material.ts" />
/// <reference path="atlas.ts" />
/// <reference path="layer.ts" />

module N4 {

    var gameExt = window['GameExt'];
    var game = Game;
    if (typeof gameExt !== 'undefined') {
        //console.log("N4 initializing... " + gameExt);

        for (var propertyName in game.prototype) {
            //if (propertyName[0] == '_')
            //    continue;

            var func = game.prototype[propertyName];

            if (typeof func !== 'function')
                continue;

            if (typeof gameExt.prototype[propertyName] !== 'undefined')
                continue;

            //console.log('Importing ' + propertyName);

            gameExt.prototype[propertyName] = func;
        }

        //gameExt.prototype['_setup'] = game.prototype['_setup'];
        //gameExt.prototype['_resize'] = game.prototype['_resize'];
        game = gameExt;
    }

    //Game = game;
}
