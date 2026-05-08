import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Emitter from "../../../../Wolfie2D/Events/Emitter";
import GameNode from "../../../../Wolfie2D/Nodes/GameNode";
import NPCActor from "../../../Actors/NPCActor";
import PlayerActor from "../../../Actors/PlayerActor";
import { LycanEvent } from "../../../Events";
import PlayerAI from "../../Player/PlayerAI";
import { sameGridTile } from "../../Pathfinding/GridAStar";
import { GameEventType } from "../../../../Wolfie2D/Events/GameEventType";
import AStarTileMovementBehavior from "./AStarTileMovementBehavior";

export default class LycanChaseBehavior extends AStarTileMovementBehavior<NPCActor> {
    private readonly emitter = new Emitter();

    private player!: PlayerActor;

    private repathTimer = 0;
    private repathInterval = 0.25;
    private lastGoalTile: Vec2 | null = null;

    private feetOffsetY = 15;

    private normalMoveDuration = 0.18;
    private boostMoveDuration = 0.1;
    private boostChance = 0.18;
    private boostStepsRemaining = 0;
    private boostMinSteps = 2;
    private boostMaxSteps = 4;

    private boostLocksDirection = false;
    private boostDirection: Vec2 | null = null;

    private catchCooldown = 0.8;
    private catchCooldownTimer = 0;

    public initializeAI(owner: GameNode, opts: Record<string, any>): void {
        this.initializeTileMovement(owner as NPCActor, opts);
        this.player = opts.player;

        this.boostLocksDirection = opts.boostLocksDirection ?? this.boostLocksDirection;

        this.normalMoveDuration = opts.moveDuration ?? this.normalMoveDuration;
        this.boostMoveDuration = opts.boostMoveDuration ?? this.boostMoveDuration;
        this.boostChance = opts.boostChance ?? this.boostChance;
        this.boostMinSteps = opts.boostMinSteps ?? this.boostMinSteps;
        this.boostMaxSteps = opts.boostMaxSteps ?? this.boostMaxSteps;

        this.moveDuration = this.normalMoveDuration;

        this.repathInterval = opts.repathInterval ?? this.repathInterval;
        this.feetOffsetY = opts.feetOffsetY ?? this.feetOffsetY;
        this.catchCooldown = opts.catchCooldown ?? this.catchCooldown;
        this.catchCooldownTimer = 0;
        this.repathTimer = 0;
    }

    public update(deltaT: number): void {
        this.catchCooldownTimer = Math.max(0, this.catchCooldownTimer - deltaT);

        if (this.targetTile) {
            this.updateMovement(deltaT);
            return;
        }

        this.repathTimer -= deltaT;

        const goalTile = this.getPlayerGoalTile();
        const playerMovedTile =
            this.lastGoalTile === null || !sameGridTile(goalTile, this.lastGoalTile);

        this.tryEmitCaughtPlayer();

        if (playerMovedTile || this.repathTimer <= 0) {
            this.chooseNextStep(goalTile);
        }

        this.owner.setSortTile(this.currentTile);
    }

    private chooseNextStep(goalTile: Vec2): void {
        this.lastGoalTile = goalTile.clone();
        this.repathTimer = this.repathInterval;
    
        const lockedBoostTile = this.getLockedBoostNextTile();
    
        if (lockedBoostTile) {
            this.beginStep(lockedBoostTile);
            return;
        }

        this.moveTowardGoalWithAStar(goalTile);
    }

    protected override getMoveDuration(direction: Vec2): number {
        this.updateBoostState(direction);

        return this.boostStepsRemaining > 0
            ? this.boostMoveDuration
            : this.normalMoveDuration;
    }

    protected override onStepStarted(direction: Vec2): void {
        this.playDirectionalAnimation("WALK", direction);
    }

    protected override onStepFinished(): void {
        const goalTile = this.getPlayerGoalTile();

        if (sameGridTile(this.currentTile, goalTile)) {
            this.tryEmitCaughtPlayer();
            this.playFacingAnimation("IDLE");
            return;
        }

        this.chooseNextStep(goalTile);
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
        this.emitter.fireEvent(GameEventType.PLAY_SFX, {
            key: this.owner.sceneAssets.sounds.wolvesDashingSFX.key,
            loop: false,
            holdReference: false
        });
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

    private getPlayerGoalTile(): Vec2 {
        const playerAI = this.player.ai as PlayerAI;
        return (playerAI.targetTile ?? playerAI.currentTile).clone();
    }

    private tryEmitCaughtPlayer(): void {
        if (this.catchCooldownTimer > 0 || !this.isTouchingPlayerTile()) {
            return;
        }

        this.catchCooldownTimer = this.catchCooldown;
        this.emitter.fireEvent(LycanEvent.PLAYER_CAUGHT, {
            lycanId: this.owner.id,
            playerId: this.player.id,
            tile: this.currentTile.clone()
        });
    }

    private isTouchingPlayerTile(): boolean {
        const playerAI = this.player.ai as PlayerAI;

        return sameGridTile(this.currentTile, playerAI.currentTile) ||
            (playerAI.targetTile !== null && sameGridTile(this.currentTile, playerAI.targetTile));
    }

    protected override getSpriteCenterForTile(tile: Vec2): Vec2 {
        const tileCenter = this.ground.getTileCenter(tile.x, tile.y);
        return new Vec2(
            tileCenter.x,
            tileCenter.y - this.owner.size.y / 2 + this.feetOffsetY
        );
    }
}
