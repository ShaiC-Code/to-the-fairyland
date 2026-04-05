import State from "../../../../Wolfie2D/DataTypes/State/State";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import { BattlerEvent, HudEvent, ItemEvent } from "../../../Events"
import Item from "../../../GameSystems/ItemSystem/Item";
import PlayerAI from "../PlayerAI";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";


export enum PlayerAnimationType {
    IDLE_UP = "IDLE_UP",
    IDLE_DOWN = "IDLE_DOWN",
    IDLE_LEFT = "IDLE_LEFT",
    IDLE_RIGHT = "IDLE_RIGHT"
}


export enum PlayerStateType {
    IDLE = "IDLE",
    INVINCIBLE = "INVINCIBLE",
    ATTACKING = "ATTACKING",
    MOVING = "MOVING",
    DEAD = "DEAD"
}

export default abstract class PlayerState extends State {

    protected parent: PlayerAI;
    protected owner: PlayerActor;

    public constructor(parent: PlayerAI, owner: PlayerActor) {
        super(parent);
        this.owner = owner;
    }
    

    public override onEnter(options: Record<string, any>): void {}
    public override onExit(): Record<string, any> { return {}; }
    public override update(deltaT: number): void {

        // Handle the player trying to pick up an item
        if (this.parent.controller.pickingUp) {
            // Request an item from the scene
            this.emitter.fireEvent(ItemEvent.ITEM_REQUEST, {node: this.owner, inventory: this.owner.inventory});
        }

        // Handle the player trying to drop an item
        if (this.parent.controller.dropping) {
            
        }

        if (this.parent.controller.useItem) {

        }
    }

    public override handleInput(event: GameEvent): void {
        switch(event.type) {
            default: {
                throw new Error(`Unhandled event of type ${event.type} caught in PlayerState!`);
            }
        }
    }

    protected getFeetPositionForTile(tile: Vec2): Vec2 {
        const tileTopLeft = this.parent.tilemap.getWorldPosition(tile.x, tile.y);
        const tileSize = this.parent.tilemap.getScaledTileSize();
    
        return new Vec2(
            tileTopLeft.x + tileSize.x / 2,
            tileTopLeft.y + tileSize.y / 2
        );
    }
    
    protected getSpriteCenterForTile(tile: Vec2): Vec2 {
        const feet = this.getFeetPositionForTile(tile);
        return this.owner.getCenterForFeetPosition(feet.x, feet.y);
    }
    
    // Simple cardinal movement
    protected canEnterTile(tile: Vec2): boolean {
        const dims = this.parent.tilemap.getDimensions();
    
        if (tile.x < 0 || tile.y < 0 || tile.x >= dims.x || tile.y >= dims.y) {
            return false;
        }
    
        return !this.parent.tilemap.isTileCollidable(tile.x, tile.y);
    }

    //Diagonal movement need to care about multiple surounding tiles
    protected canMoveToTile(currentTile: Vec2, direction: Vec2): boolean {
        const nextTile = currentTile.clone().add(direction);
        if (!this.canEnterTile(nextTile)) {
            return false;
        }

        if (direction.x !== 0 && direction.y !== 0) {
            const horizontalTile = currentTile.clone().add(new Vec2(direction.x, 0));
            const verticalTile = currentTile.clone().add(new Vec2(0, direction.y));

            return this.canEnterTile(horizontalTile) && this.canEnterTile(verticalTile);
        }

        return true;
    }

    // Diagonal steps take longer so world speed stays consistent
    protected getMoveDuration(direction: Vec2): number {
        const isDiagonal = direction.x !== 0 && direction.y !== 0;
        return this.parent.moveDuration * (isDiagonal ? Math.SQRT2 : 1);
    }
    
    protected getFacingAnimation(): PlayerAnimationType {
        if (this.parent.facing.y < 0) return PlayerAnimationType.IDLE_UP;
        if (this.parent.facing.y > 0) return PlayerAnimationType.IDLE_DOWN;
        if (this.parent.facing.x < 0) return PlayerAnimationType.IDLE_LEFT;
        if (this.parent.facing.x > 0) return PlayerAnimationType.IDLE_RIGHT;
        return PlayerAnimationType.IDLE_DOWN;
    }
    
    protected playFacingAnimation(): void {
        this.owner.animation.playIfNotAlready(this.getFacingAnimation(), true);
    }
    

}

import Idle from "./Idle";
import Invincible from "./Invincible";
import Moving from "./Moving";
import Dead from "./Dead";
import PlayerActor from "../../../Actors/PlayerActor";
export { Idle, Invincible, Moving, Dead} 
