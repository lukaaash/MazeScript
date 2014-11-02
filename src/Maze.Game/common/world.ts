/// <reference path="player.ts" />
/// <reference path="maze.ts" />

interface IWorld {
    maze: Maze;
    time: number;
    players: Dictionary<number, Player>;
}

declare var world: IWorld;