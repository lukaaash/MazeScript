/// <reference path="player.ts" />
/// <reference path="maze.ts" />
/// <reference path="dictionary.ts" />

interface IWorld {
    maze: Maze;
    time: number;
    players: Dictionary<number, Player>;
}

declare var world: IWorld;