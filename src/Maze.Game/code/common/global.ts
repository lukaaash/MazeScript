/// <reference path="maze.ts" />
/// <reference path="player.ts" />
/// <reference path="dictionary.ts" />

interface IGlobal {
    maze: Maze;
    time: number;
    players: Dictionary<number, Player>;
}

var global: IGlobal = null;

