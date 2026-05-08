import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameNode from "../../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { sameGridTile } from "../../Pathfinding/GridAStar";
import AStarTileMovementBehavior from "../../NPC/NPCBehavior/AStarTileMovementBehavior";
import PlayerActor from "../../../Actors/PlayerActor";
import PlayerAI from "../../Player/PlayerAI";


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
    private onRescueComplete?: () => void;

    private player!: PlayerActor;

    private dolphinMoveDuration = 0.4;

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
        this.onRescueComplete = options.onRescueComplete;

    }

    public update(deltaT: number): void {
        if (this.pathWaypoints.length === 0) {
            return;
        }

        if (this.facingHoldTimer > 0) {
            this.facingHoldTimer = Math.max(0, this.facingHoldTimer - deltaT);
            this.syncCarriedPlayer();
            return;
        }

        if (this.targetTile) {
            this.updateMovement(deltaT);
            this.syncCarriedPlayer();
            return;
        }

        this.chooseNextStep();
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
                break;
    
            case "release_player":
                this.carryingPlayer = false;
                break;
    
            case "rescue_complete":
                this.onRescueComplete?.();
                break;
        }
    }
    
    
}
