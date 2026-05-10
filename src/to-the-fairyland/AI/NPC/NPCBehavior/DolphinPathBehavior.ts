import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameNode from "../../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import { sameGridTile } from "../../Pathfinding/GridAStar";
import AStarTileMovementBehavior from "./AStarTileMovementBehavior";
import PlayerActor from "../../../Actors/PlayerActor";
import PlayerAI from "../../Player/PlayerAI";
import FairyParticleBehavior, {
    defaultFairyParticleSettings,
    FairyParticleSettings
} from "../../FairyParticleBehavior";


type DolphinWaypoint = {
    tile: Vec2;
    facing?: Vec2;
    facingHoldSeconds?: number;
    action?: string;
};


export default class DolphinPathBehavior extends AStarTileMovementBehavior<AnimatedSprite> {
    private pathWaypoints: DolphinWaypoint[] = [];
    private pathIndex = 0;
    private facingHoldTimer = 0;
    private carryingPlayer = false;
    private onPlayerGrabbed?: () => void;
    private onRescueComplete?: () => void;

    private player!: PlayerActor;

    private dolphinMoveDuration = 0.4;
    private velocity = Vec2.ZERO;

    private particleSpriteKey: string | null = null;
    private particleLayerName = "DolphinFairyParticles";
    private particlePoolSize = 36;
    private particleSpawnSpread = 14;
    private particleEmitTimer = 0;
    private particleEmitIntervalMin = 0.025;
    private particleEmitIntervalMax = 0.06;
    private particleMinMoveSpeed = 20;
    private dolphinParticles: Sprite[] = [];
    private particleSettings: FairyParticleSettings = defaultFairyParticleSettings;

    public initializeAI(owner: GameNode, options: Record<string, any>): void {
        this.initializeTileMovement(owner as AnimatedSprite, options);
        this.pathWaypoints = (options.pathWaypoints ?? []).map((point: DolphinWaypoint) => ({
            tile: point.tile.clone(),
            facing: point.facing?.clone(),
            facingHoldSeconds: point.facingHoldSeconds ?? 0,
            action: point.action
        }));
        this.dolphinMoveDuration = options.moveDuration ?? this.dolphinMoveDuration;
        this.facing = Vec2.LEFT;
        this.playFacingAnimation("IDLE");
        this.player = options.player;
        this.onPlayerGrabbed = options.onPlayerGrabbed;
        this.onRescueComplete = options.onRescueComplete;

        this.particleSpriteKey = options.particleSpriteKey ?? this.particleSpriteKey;
        this.particleLayerName = options.particleLayerName ?? this.particleLayerName;
        this.particlePoolSize = options.particlePoolSize ?? this.particlePoolSize;
        this.particleSpawnSpread = options.particleSpawnSpread ?? this.particleSpawnSpread;
        this.particleEmitIntervalMin = options.particleEmitIntervalMin ?? this.particleEmitIntervalMin;
        this.particleEmitIntervalMax = options.particleEmitIntervalMax ?? this.particleEmitIntervalMax;
        this.particleMinMoveSpeed = options.particleMinMoveSpeed ?? this.particleMinMoveSpeed;
        this.particleSettings = {
            ...defaultFairyParticleSettings,
            ...(options.particleSettings ?? {})
        };
        this.setupParticlePool();
    }

    public update(deltaT: number): void {
        const previousPosition = this.owner.position.clone();

        if (this.pathWaypoints.length > 0) {
            if (this.facingHoldTimer > 0) {
                this.facingHoldTimer = Math.max(0, this.facingHoldTimer - deltaT);
                this.syncCarriedPlayer();
            } else if (this.targetTile) {
                this.updateMovement(deltaT);
                this.syncCarriedPlayer();
            } else {
                this.chooseNextStep();
            }
        }

        this.updateVelocity(previousPosition, deltaT);
        this.updateParticleEmission(deltaT);
    }

    private getDynamicBlockedTiles(goalTile: Vec2): Vec2[] {
        if (!this.player) {
            return [];
        }
    
        const playerAI = this.player.ai as PlayerAI;
        const playerTile = (playerAI.targetTile ?? playerAI.currentTile).clone();
    
        // Allow A* to path INTO the player tile only if that is the current goal.
        if (sameGridTile(playerTile, goalTile)) {
            return [];
        }
    
        return [playerTile];
    }
    

    private chooseNextStep(): void {
        if (this.pathIndex >= this.pathWaypoints.length) {
            this.playFacingAnimation("IDLE");
            return;
        }
    
        let goalTile = this.pathWaypoints[this.pathIndex].tile;
    
        if (sameGridTile(this.currentTile, goalTile)) {
            const holdSeconds = this.applyWaypointFacing();
            this.applyWaypointAction();
        
            this.pathIndex++;
        
            if (holdSeconds > 0) {
                this.facingHoldTimer = holdSeconds;
                return;
            }
        
            if (this.pathIndex >= this.pathWaypoints.length) {
                this.playFacingAnimation("IDLE");
                return;
            }
        
            goalTile = this.pathWaypoints[this.pathIndex].tile;
        }        
        
    
        this.moveTowardGoalWithAStar(
            goalTile,
            this.getDynamicBlockedTiles(goalTile)
        );
    }
    
    private applyWaypointFacing(): number {
        const waypoint = this.pathWaypoints[this.pathIndex];
    
        if (waypoint?.facing && !this.facing.equals(waypoint.facing)) {
            this.facing = waypoint.facing.clone();
            this.playFacingAnimation("IDLE");
        }
    
        return waypoint?.facingHoldSeconds ?? 0;
    }
    
    

    protected override getMoveDuration(_direction: Vec2): number {
        return this.dolphinMoveDuration;
    }
    

    protected override onStepFinished(): void {
        this.chooseNextStep();
    }

    private syncCarriedPlayer(): void {
        if (!this.carryingPlayer || !this.player) {
            return;
        }
    
        this.player.position.copy(this.owner.position);
    }

    private applyWaypointAction(): void {
        const waypoint = this.pathWaypoints[this.pathIndex];
    
        switch (waypoint?.action) {
            case "grab_player":
                this.carryingPlayer = true;
                this.syncCarriedPlayer();
                this.onPlayerGrabbed?.();
                break;
    
            case "release_player":
                this.carryingPlayer = false;
                break;
    
            case "rescue_complete":
                this.onRescueComplete?.();
                break;
        }
    }

    private updateVelocity(previousPosition: Vec2, deltaT: number): void {
        if (deltaT <= 0) {
            this.velocity.zero();
            return;
        }

        this.velocity = previousPosition.vecTo(this.owner.position).scale(1 / deltaT);
    }

    private setupParticlePool(): void {
        if (!this.particleSpriteKey) {
            return;
        }

        for (let i = 0; i < this.particlePoolSize; i++) {
            const particle = this.owner.getScene().add.sprite(
                this.particleSpriteKey,
                this.particleLayerName
            );

            particle.visible = false;
            particle.alpha = 0;
            particle.addAI(FairyParticleBehavior, {
                settings: this.particleSettings
            });

            this.dolphinParticles.push(particle);
        }
    }

    private updateParticleEmission(deltaT: number): void {
        if (!this.particleSpriteKey) {
            return;
        }

        this.particleEmitTimer -= deltaT;

        while (this.particleEmitTimer <= 0) {
            this.emitParticle();
            this.particleEmitTimer += this.randomBetween(
                this.particleEmitIntervalMin,
                this.particleEmitIntervalMax
            );
        }
    }

    private emitParticle(): void {
        const particle = this.dolphinParticles.find(candidate => !candidate.visible);

        if (!particle) {
            return;
        }

        const particleAI = particle.ai as FairyParticleBehavior;

        particleAI.activate({
            origin: this.owner.position.clone(),
            sourceVelocity: this.getParticleSourceVelocity(),
            spawnSpread: this.particleSpawnSpread,
            settings: this.particleSettings
        });
    }

    private getParticleSourceVelocity(): Vec2 {
        if (this.velocity.magSq() < this.particleMinMoveSpeed * this.particleMinMoveSpeed) {
            return Vec2.ZERO;
        }

        return this.velocity.clone();
    }

    private randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
    
    
}
