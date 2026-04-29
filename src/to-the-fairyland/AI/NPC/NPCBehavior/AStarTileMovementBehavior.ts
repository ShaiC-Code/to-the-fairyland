import AI from "../../../../Wolfie2D/DataTypes/Interfaces/AI";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import GameNode from "../../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import OrthogonalTilemap from "../../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import { findCardinalAStarPath } from "../../Pathfinding/GridAStar";

export default abstract class AStarTileMovementBehavior<
    TOwner extends AnimatedSprite = AnimatedSprite
> implements AI {
    protected owner!: TOwner;
    protected ground!: OrthogonalTilemap;
    protected collision!: OrthogonalTilemap;

    protected currentTile!: Vec2;
    protected targetTile: Vec2 | null = null;

    protected moveStart!: Vec2;
    protected moveEnd!: Vec2;
    protected moveProgress = 0;
    protected moveDuration = 0.18;
    protected facing: Vec2 = Vec2.DOWN;

    public abstract initializeAI(owner: GameNode, options: Record<string, any>): void;

    public abstract update(deltaT: number): void;

    public activate(_options: Record<string, any>): void {}

    public destroy(): void {}

    public handleEvent(_event: GameEvent): void {}

    protected initializeTileMovement(owner: TOwner, options: Record<string, any>): void {
        this.owner = owner;
        this.ground = options.ground;
        this.collision = options.collision;

        const sortTile = this.owner.getSortTile();

        this.currentTile =
            options.startTile?.clone() ??
            sortTile?.clone() ??
            this.ground.getTilemapPosition(this.owner.position.x, this.owner.position.y);

        this.moveStart = this.owner.position.clone();
        this.moveEnd = this.owner.position.clone();
        this.moveProgress = 0;
        this.targetTile = null;
        this.owner.setSortTile(this.currentTile);
    }

    protected moveTowardGoalWithAStar(goalTile: Vec2, blockedTiles: Vec2[] = []): boolean {
        const path = findCardinalAStarPath(
            this.currentTile,
            goalTile,
            this.collision,
            blockedTiles
        );

        if (path.length < 2) {
            this.targetTile = null;
            this.playFacingAnimation("IDLE");
            return false;
        }

        this.beginStep(path[1]);
        return true;
    }

    protected beginStep(nextTile: Vec2): void {
        const direction = nextTile.clone().sub(this.currentTile);

        this.facing = direction;
        this.targetTile = nextTile.clone();
        this.moveStart = this.owner.position.clone();
        this.moveEnd = this.getSpriteCenterForTile(nextTile);
        this.moveProgress = 0;
        this.moveDuration = this.getMoveDuration(direction);

        this.owner.setSortTile(nextTile);
        this.onStepStarted(direction);
    }

    protected updateMovement(deltaT: number): void {
        this.moveProgress += deltaT / this.moveDuration;

        if (this.moveProgress >= 1) {
            this.owner.position.copy(this.moveEnd);
            this.currentTile = this.targetTile!.clone();
            this.targetTile = null;
            this.moveProgress = 0;

            this.owner.setSortTile(this.currentTile);
            this.onStepFinished();
            return;
        }

        this.owner.position.copy(
            Vec2.lerp(this.moveStart, this.moveEnd, this.moveProgress)
        );
    }

    protected canEnterTile(tile: Vec2): boolean {
        const dims = this.collision.getDimensions();

        if (tile.x < 0 || tile.y < 0 || tile.x >= dims.x || tile.y >= dims.y) {
            return false;
        }

        return !this.collision.isTileCollidable(tile.x, tile.y);
    }

    protected getMoveDuration(_direction: Vec2): number {
        return this.moveDuration;
    }

    protected getSpriteCenterForTile(tile: Vec2): Vec2 {
        return this.ground.getTileCenter(tile.x, tile.y);
    }

    protected onStepStarted(_direction: Vec2): void {
        this.playFacingAnimation("IDLE");
    }

    protected onStepFinished(): void {}

    protected playFacingAnimation(animationPrefix: string): void {
        this.playDirectionalAnimation(animationPrefix, this.facing);
    }

    protected playDirectionalAnimation(animationPrefix: string, direction: Vec2): void {
        if (direction.y < 0) {
            this.owner.animation.playIfNotAlready(`${animationPrefix}_UP`, true);
        } else if (direction.y > 0) {
            this.owner.animation.playIfNotAlready(`${animationPrefix}_DOWN`, true);
        } else if (direction.x < 0) {
            this.owner.animation.playIfNotAlready(`${animationPrefix}_LEFT`, true);
        } else if (direction.x > 0) {
            this.owner.animation.playIfNotAlready(`${animationPrefix}_RIGHT`, true);
        }
    }
}
