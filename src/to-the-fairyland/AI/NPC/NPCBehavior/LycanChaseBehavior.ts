import AI from "../../../../Wolfie2D/DataTypes/Interfaces/AI";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import GameNode from "../../../../Wolfie2D/Nodes/GameNode";
import OrthogonalTilemap from "../../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import NPCActor from "../../../Actors/NPCActor";
import PlayerActor from "../../../Actors/PlayerActor";
import PlayerAI from "../../Player/PlayerAI";
import { findCardinalAStarPath, sameGridTile } from "../../Pathfinding/GridAStar";

export default class LycanChaseBehavior implements AI {
    private owner!: NPCActor;
    private player!: PlayerActor;
    private ground!: OrthogonalTilemap;
    private collision!: OrthogonalTilemap;

    private currentTile!: Vec2;
    private targetTile: Vec2 | null = null;

    private moveStart!: Vec2;
    private moveEnd!: Vec2;
    private moveProgress = 0;
    private moveDuration = 0.18;

    private repathTimer = 0;
    private repathInterval = 0.25;
    private lastGoalTile: Vec2 | null = null;

    private facing: Vec2 = Vec2.DOWN;
    private feetOffsetY = 15;

    private normalMoveDuration = 0.18;
    private boostMoveDuration = 0.1;
    private boostChance = 0.18;
    private boostStepsRemaining = 0;
    private boostMinSteps = 2;
    private boostMaxSteps = 4;

    private boostLocksDirection = false;
    private boostDirection: Vec2 | null = null;


    public initializeAI(owner: GameNode, opts: Record<string, any>): void {
        this.owner = owner as NPCActor;
        this.player = opts.player;
        this.ground = opts.ground;
        this.collision = opts.collision;

        this.boostLocksDirection = opts.boostLocksDirection ?? this.boostLocksDirection;

        this.normalMoveDuration = opts.moveDuration ?? this.normalMoveDuration;
        this.boostMoveDuration = opts.boostMoveDuration ?? this.boostMoveDuration;
        this.boostChance = opts.boostChance ?? this.boostChance;
        this.boostMinSteps = opts.boostMinSteps ?? this.boostMinSteps;
        this.boostMaxSteps = opts.boostMaxSteps ?? this.boostMaxSteps;

        this.moveDuration = this.normalMoveDuration;

        this.repathInterval = opts.repathInterval ?? this.repathInterval;
        this.feetOffsetY = opts.feetOffsetY ?? this.feetOffsetY;

        const sortTile = this.owner.getSortTile();

        this.currentTile =
            opts.startTile?.clone() ??
            sortTile?.clone() ??
            this.ground.getTilemapPosition(this.owner.position.x, this.owner.position.y);

        this.moveStart = this.owner.position.clone();
        this.moveEnd = this.owner.position.clone();
        this.repathTimer = 0;
    }

    public update(deltaT: number): void {
        if (this.targetTile) {
            this.updateMovement(deltaT);
            return;
        }

        this.repathTimer -= deltaT;

        const goalTile = this.getPlayerGoalTile();
        const playerMovedTile =
            this.lastGoalTile === null || !sameGridTile(goalTile, this.lastGoalTile);

        if (playerMovedTile || this.repathTimer <= 0) {
            this.chooseNextStep(goalTile);
        }

        this.owner.setSortTile(this.currentTile);
    }

    public activate(_options: Record<string, any>): void {}

    public destroy(): void {}

    public handleEvent(_event: GameEvent): void {}

    private chooseNextStep(goalTile: Vec2): void {
        this.lastGoalTile = goalTile.clone();
        this.repathTimer = this.repathInterval;
    
        const lockedBoostTile = this.getLockedBoostNextTile();
    
        if (lockedBoostTile) {
            this.beginStep(lockedBoostTile);
            return;
        }
    
        const path = findCardinalAStarPath(this.currentTile, goalTile, this.collision);
    
        if (path.length < 2) {
            this.targetTile = null;
            this.playIdleAnimation();
            return;
        }
    
        this.beginStep(path[1]);
    }

    private beginStep(nextTile: Vec2): void {
        const direction = nextTile.clone().sub(this.currentTile);
    
        this.updateBoostState(direction);
    
        this.moveDuration = this.boostStepsRemaining > 0
            ? this.boostMoveDuration
            : this.normalMoveDuration;
    
        this.facing = direction;
        this.targetTile = nextTile.clone();
        this.moveStart = this.owner.position.clone();
        this.moveEnd = this.getSpriteCenterForTile(nextTile);
        this.moveProgress = 0;
    
        this.owner.setSortTile(nextTile);
        this.playWalkAnimation(direction);
    }

    private updateBoostState(direction: Vec2): void {
        if (this.boostStepsRemaining > 0) {
            this.boostStepsRemaining--;
            return;
        }
    
        this.boostDirection = null;
    
        if (Math.random() > this.boostChance) {
            return;
        }
    
        const boostStepCount =
            this.boostMinSteps +
            Math.floor(Math.random() * (this.boostMaxSteps - this.boostMinSteps + 1));
    
        this.boostStepsRemaining = boostStepCount;
        this.boostDirection = direction.clone();
    }
       

    private getLockedBoostNextTile(): Vec2 | null {
        if (!this.boostLocksDirection) {
            return null;
        }
    
        if (this.boostStepsRemaining <= 0 || this.boostDirection === null) {
            return null;
        }
    
        const nextTile = this.currentTile.clone().add(this.boostDirection);
    
        if (!this.canEnterTile(nextTile)) {
            return null;
        }
    
        return nextTile;
    }
    
    private canEnterTile(tile: Vec2): boolean {
        const dims = this.collision.getDimensions();
    
        if (tile.x < 0 || tile.y < 0 || tile.x >= dims.x || tile.y >= dims.y) {
            return false;
        }
    
        return !this.collision.isTileCollidable(tile.x, tile.y);
    }
    
    

    private updateMovement(deltaT: number): void {
        this.moveProgress += deltaT / this.moveDuration;

        if (this.moveProgress >= 1) {
            this.owner.position.copy(this.moveEnd);
            this.currentTile = this.targetTile!.clone();
            this.targetTile = null;
            this.moveProgress = 0;

            this.owner.setSortTile(this.currentTile);

            const goalTile = this.getPlayerGoalTile();

            if (sameGridTile(this.currentTile, goalTile)) {
                this.playIdleAnimation();
                return;
            }

            this.chooseNextStep(goalTile);
            return;
        }

        this.owner.position.copy(
            Vec2.lerp(this.moveStart, this.moveEnd, this.moveProgress)
        );
    }

    private getPlayerGoalTile(): Vec2 {
        const playerAI = this.player.ai as PlayerAI;
        return (playerAI.targetTile ?? playerAI.currentTile).clone();
    }

    private getSpriteCenterForTile(tile: Vec2): Vec2 {
        const tileCenter = this.ground.getTileCenter(tile.x, tile.y);
        return new Vec2(
            tileCenter.x,
            tileCenter.y - this.owner.size.y / 2 + this.feetOffsetY
        );
    }

    private playWalkAnimation(direction: Vec2): void {
        if (direction.y < 0) {
            this.owner.animation.playIfNotAlready("WALK_UP", true);
        } else if (direction.y > 0) {
            this.owner.animation.playIfNotAlready("WALK_DOWN", true);
        } else if (direction.x < 0) {
            this.owner.animation.playIfNotAlready("WALK_LEFT", true);
        } else if (direction.x > 0) {
            this.owner.animation.playIfNotAlready("WALK_RIGHT", true);
        }
    }

    private playIdleAnimation(): void {
        if (this.facing.y < 0) {
            this.owner.animation.playIfNotAlready("IDLE_UP", true);
        } else if (this.facing.y > 0) {
            this.owner.animation.playIfNotAlready("IDLE_DOWN", true);
        } else if (this.facing.x < 0) {
            this.owner.animation.playIfNotAlready("IDLE_LEFT", true);
        } else if (this.facing.x > 0) {
            this.owner.animation.playIfNotAlready("IDLE_RIGHT", true);
        }
    }
}
