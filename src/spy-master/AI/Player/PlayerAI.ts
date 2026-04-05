import StateMachineAI from "../../../Wolfie2D/AI/StateMachineAI";
import AI from "../../../Wolfie2D/DataTypes/Interfaces/AI";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import PlayerActor from "../../Actors/PlayerActor";
import { BattlerEvent, ItemEvent } from "../../Events";
import Inventory from "../../GameSystems/ItemSystem/Inventory";
import Item from "../../GameSystems/ItemSystem/Item";
import PlayerController from "./PlayerController";
import { Idle, Invincible, Moving, Dead, PlayerStateType } from "./PlayerStates/PlayerState";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";


/**
 * The AI that controls the player. The players AI has been configured as a Finite State Machine (FSM)
 * with 4 states; Idle, Moving, Invincible, and Dead.
 */
export default class PlayerAI extends StateMachineAI implements AI {

    /** The GameNode that owns this AI */
    public owner: PlayerActor;
    /** A set of controls for the player */
    public controller: PlayerController;
    /** The inventory object associated with the player */
    public inventory: Inventory;
    /** The players held item */
    public item: Item | null;

    public currentTile!: Vec2;
    public targetTile: Vec2 | null = null;
    public moving = false;
    public facing: Vec2 = Vec2.DOWN;

    public tilemap!: OrthogonalTilemap;
    public moveStart!: Vec2;
    public moveEnd!: Vec2;
    public moveProgress = 0; //Percentage moved
    public moveDuration = 0.16; //Player speed, time to finish moving 1 tile
    public currentMoveDuration = this.moveDuration; //for diagonal normalization where speed changes
    
    public initializeAI(owner: PlayerActor, opts: Record<string, any>): void {
        this.currentMoveDuration = this.moveDuration;

        this.owner = owner;
        this.controller = new PlayerController(owner);

        this.currentTile = opts.startTile.clone();
        this.targetTile = null;
        this.moving = false;
        this.facing = Vec2.DOWN;

        this.tilemap = opts.tilemap;
        this.moveStart = owner.position.clone();
        this.moveEnd = owner.position.clone();
        this.moveProgress = 0;
        this.currentMoveDuration = this.moveDuration;

        // Add the players states to it's StateMachine
        this.addState(PlayerStateType.IDLE, new Idle(this, this.owner));
        this.addState(PlayerStateType.INVINCIBLE, new Invincible(this, this.owner));
        this.addState(PlayerStateType.MOVING, new Moving(this, this.owner));
        this.addState(PlayerStateType.DEAD, new Dead(this, this.owner));
        
        // Initialize the players state to Idle
        this.initialize(PlayerStateType.IDLE);
    }

    public activate(options: Record<string, any>): void { }

    public update(deltaT: number): void {
        this.controller.update();
        super.update(deltaT);
    }

    public destroy(): void {}

    public handleEvent(event: GameEvent): void {
        switch(event.type) {
            case ItemEvent.LASERGUN_FIRED: {
                this.handleLaserFiredEvent(event.data.get("actorId"), event.data.get("to"), event.data.get("from"));
                break;
            }
            case BattlerEvent.BATTLER_KILLED: {
                if (event.data.get("id") === this.owner.id) {
                    this.changeState(PlayerStateType.DEAD);
                }
                break;
            }
            default: {
                super.handleEvent(event);
                break;
            }
        }
    }

    protected handleLaserFiredEvent(actorId: number, to: Vec2, from: Vec2): void {
        if (this.owner.id !== actorId && this.owner.collisionShape !== undefined ) {
            if (this.owner.collisionShape.getBoundingRect().intersectSegment(to, from.clone().sub(to)) !== null) {
                this.owner.health -= 1;
            }
        }
    }


}
