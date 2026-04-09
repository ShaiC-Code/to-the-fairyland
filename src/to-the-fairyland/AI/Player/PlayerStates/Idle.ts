import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import { PlayerAnimationType, PlayerStateType } from "./PlayerState";
import PlayerState from "./PlayerState";

export default class Idle extends PlayerState {

    public override onEnter(options: Record<string, any>): void {
        this.playFacingAnimation();
    }

    public override handleInput(event: GameEvent): void {
        switch(event.type) {
            default: {
                super.handleInput(event);
                break;
            }
        }
    }

    public override update(deltaT: number): void {
        super.update(deltaT);

        const dir = this.parent.controller.tileInput;
        if (dir.isZero()) {
            return;
        }

        this.parent.facing = dir;
        this.playFacingAnimation();


        if (!this.canMoveToTile(this.parent.currentTile, dir)) {
            return;
        }

        const nextTile = this.parent.currentTile.clone().add(dir);
        this.parent.targetTile = nextTile;
        this.parent.moveStart = this.owner.position.clone();
        this.parent.moveEnd = this.getSpriteCenterForTile(nextTile);
        this.parent.moveProgress = 0;
        this.parent.currentMoveDuration = this.getMoveDuration(dir);
        this.parent.moving = true;

        this.finished(PlayerStateType.MOVING);
    }

    public override onExit(): Record<string, any> { 
        return {}; 
    }
    
}
