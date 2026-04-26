import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";

function getCardinalDirectionsTowardGoal(from: Vec2, goal: Vec2): Vec2[] {
    const dx = goal.x - from.x;
    const dy = goal.y - from.y;

    const horizontal = dx < 0 ? Vec2.LEFT : Vec2.RIGHT;
    const vertical = dy < 0 ? Vec2.UP : Vec2.DOWN;

    const oppositeHorizontal = dx < 0 ? Vec2.RIGHT : Vec2.LEFT;
    const oppositeVertical = dy < 0 ? Vec2.DOWN : Vec2.UP;

    if (Math.abs(dx) >= Math.abs(dy)) {
        return [
            horizontal,
            vertical,
            oppositeVertical,
            oppositeHorizontal
        ];
    }

    return [
        vertical,
        horizontal,
        oppositeHorizontal,
        oppositeVertical
    ];
}


export function findCardinalAStarPath(
    start: Vec2,
    goal: Vec2,
    tilemap: OrthogonalTilemap
): Vec2[] {
    const startTile = normalizeTile(start);
    const goalTile = normalizeTile(goal);

    if (!canEnterTile(goalTile, tilemap)) {
        return [];
    }

    // String (A,B) for which tile
    const startKey = tileKey(startTile);
    const goalKey = tileKey(goalTile);

    const open: Vec2[] = [startTile];
    const openKeys = new Set<string>([startKey]);
    const closedKeys = new Set<string>();

    const cameFrom = new Map<string, string>();
    const tileByKey = new Map<string, Vec2>([[startKey, startTile]]);

    //gScore - cost from the start tile to this tile
    //fScore - estimated total cost of the full path
    const gScore = new Map<string, number>([[startKey, 0]]);
    // horizontal distance + vertical distance
    const fScore = new Map<string, number>([
        [startKey, manhattanDistance(startTile, goalTile)]
    ]);

    while (open.length > 0) {
        const currentIndex = getLowestFScoreIndex(open, fScore);
        const current = open.splice(currentIndex, 1)[0];
        const currentKey = tileKey(current);

        openKeys.delete(currentKey);

        if (currentKey === goalKey) {
            return reconstructPath(currentKey, cameFrom, tileByKey);
        }

        closedKeys.add(currentKey);

        for (const direction of getCardinalDirectionsTowardGoal(current, goalTile)) {
            const neighbor = current.clone().add(direction);
            const neighborKey = tileKey(neighbor);

            if (closedKeys.has(neighborKey)) {
                continue;
            }

            if (!canEnterTile(neighbor, tilemap)) {
                continue;
            }

            const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;

            if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) {
                continue;
            }

            cameFrom.set(neighborKey, currentKey);
            tileByKey.set(neighborKey, neighbor);
            gScore.set(neighborKey, tentativeG);
            fScore.set(
                neighborKey,
                tentativeG + manhattanDistance(neighbor, goalTile)
            );

            if (!openKeys.has(neighborKey)) {
                open.push(neighbor);
                openKeys.add(neighborKey);
            }
        }
    }

    return [];
}

export function sameGridTile(a: Vec2, b: Vec2): boolean {
    return Math.floor(a.x) === Math.floor(b.x) && Math.floor(a.y) === Math.floor(b.y);
}

function canEnterTile(tile: Vec2, tilemap: OrthogonalTilemap): boolean {
    const dims = tilemap.getDimensions();

    if (tile.x < 0 || tile.y < 0 || tile.x >= dims.x || tile.y >= dims.y) {
        return false;
    }

    return !tilemap.isTileCollidable(tile.x, tile.y);
}

function getLowestFScoreIndex(open: Vec2[], fScore: Map<string, number>): number {
    let bestIndex = 0;
    let bestScore = fScore.get(tileKey(open[0])) ?? Infinity;

    for (let i = 1; i < open.length; i++) {
        const score = fScore.get(tileKey(open[i])) ?? Infinity;

        if (score < bestScore) {
            bestScore = score;
            bestIndex = i;
        }
    }

    return bestIndex;
}

function reconstructPath(
    endKey: string,
    cameFrom: Map<string, string>,
    tileByKey: Map<string, Vec2>
): Vec2[] {
    const path = [tileByKey.get(endKey)!.clone()];
    let currentKey = endKey;

    while (cameFrom.has(currentKey)) {
        currentKey = cameFrom.get(currentKey)!;
        path.unshift(tileByKey.get(currentKey)!.clone());
    }

    return path;
}

function manhattanDistance(a: Vec2, b: Vec2): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function normalizeTile(tile: Vec2): Vec2 {
    return new Vec2(Math.floor(tile.x), Math.floor(tile.y));
}

function tileKey(tile: Vec2): string {
    return `${tile.x},${tile.y}`;
}
