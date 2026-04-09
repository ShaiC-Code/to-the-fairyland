import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import { PlayerStateType } from "./PlayerState";
import PlayerState from "./PlayerState";

export default class Moving extends PlayerState {
    
    public override onEnter(options: Record<string, any>): void {
        this.playFacingAnimation();
    }

    public override handleInput(event: GameEvent): void { 
        switch(event.type) {
            default: {
                super.handleInput(event);
            }
        }
    }

    public override update(deltaT: number): void {
        super.update(deltaT);

        this.parent.moveProgress += deltaT / this.parent.currentMoveDuration;

        // A single frame can sometimes finish a step and still have a little
        // movement time left over, so we handle completed tile steps in a loop.
        while (this.parent.moveProgress >= 1) {
            const overflowTime = (this.parent.moveProgress - 1) * this.parent.currentMoveDuration;
    
            this.owner.position.copy(this.parent.moveEnd);
            this.parent.currentTile = this.parent.targetTile!.clone();
            this.parent.targetTile = null;
            this.parent.moving = false;
    
             // Check whether the player is still holding a movement direction.
            const dir = this.parent.controller.tileInput;
            if (dir.isZero()) {
                this.parent.moveProgress = 0;
                this.finished(PlayerStateType.IDLE);
                return;
            }
    
            // Update facing to match the held direction.
            this.parent.facing = dir;
            this.playFacingAnimation();
    
            if (!this.canMoveToTile(this.parent.currentTile, dir)) {
                this.parent.moveProgress = 0;
                this.finished(PlayerStateType.IDLE);
                return;
            }

            const nextTile = this.parent.currentTile.clone().add(dir);
            this.parent.targetTile = nextTile;
            this.parent.moveStart = this.owner.position.clone();
            this.parent.moveEnd = this.getSpriteCenterForTile(nextTile);

            this.parent.currentMoveDuration = this.getMoveDuration(dir);
            this.parent.moveProgress = overflowTime / this.parent.currentMoveDuration;
            this.parent.moving = true;
        }
    
        // If progress is still below 1, we are mid-step, so interpolate the player between the start tile center and target tile center.
        this.owner.position.copy(
            Vec2.lerp(this.parent.moveStart, this.parent.moveEnd, this.parent.moveProgress)
        );
    }

    public override onExit(): Record<string, any> { return {}; }
}
