import AI from "../../../../Wolfie2D/DataTypes/Interfaces/AI";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import GameNode from "../../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import PlayerActor from "../../../Actors/PlayerActor";

export default class ToothFairyApproachBehavior implements AI {
    private owner!: AnimatedSprite;
    private player!: PlayerActor;

    private velocity = Vec2.ZERO;
    private elapsed = 0;
    private phase = 0;

    private maxSpeed = 200;
    private maxAcceleration = 260;
    private drag = 0.85;

    private arriveRadius = 180;
    private stopDistance = 60;

    private waveStrength = 45;
    private waveFrequency = 2.2;

    private hoverStrength = 18;
    private hoverFrequency = 2.0;
    private minHoverSpeed = 16;

    public initializeAI(owner: GameNode, options: Record<string, any>): void {
        this.owner = owner as AnimatedSprite;
        this.player = options.player;

        this.maxSpeed = options.maxSpeed ?? this.maxSpeed;
        this.maxAcceleration = options.maxAcceleration ?? this.maxAcceleration;
        this.drag = options.drag ?? this.drag;

        this.arriveRadius = options.arriveRadius ?? this.arriveRadius;
        this.stopDistance = options.stopDistance ?? this.stopDistance;

        this.waveStrength = options.waveStrength ?? this.waveStrength;
        this.waveFrequency = options.waveFrequency ?? this.waveFrequency;

        this.hoverStrength = options.hoverStrength ?? this.hoverStrength;
        this.hoverFrequency = options.hoverFrequency ?? this.hoverFrequency;
        this.minHoverSpeed = options.minHoverSpeed ?? this.minHoverSpeed;

        this.phase = Math.random() * Math.PI * 2;

        const startDirection = this.owner.position.dirTo(this.player.position);
        this.velocity = startDirection.scaled(this.minHoverSpeed);

        this.playFacingAnimation();
    }

    public update(deltaT: number): void {
        this.elapsed += deltaT;

        const desiredVelocity = this.getArriveVelocity();
        const acceleration = desiredVelocity.clone().sub(this.velocity);

        this.limitVector(acceleration, this.maxAcceleration);
        acceleration.add(this.getHoverAcceleration());
        acceleration.add(this.velocity.scaled(-this.drag));

        this.velocity.add(acceleration.scaled(deltaT));
        this.limitVector(this.velocity, this.maxSpeed);

        this.owner.position.add(this.velocity.scaled(deltaT));

        this.playFacingAnimation();
    }

    public destroy(): void {}

    public activate(_options: Record<string, any>): void {}

    public handleEvent(_event: GameEvent): void {}

    private getArriveVelocity(): Vec2 {
        const toPlayer = this.owner.position.vecTo(this.player.position);
        const distance = toPlayer.mag();

        if (distance <= 0.001) {
            return Vec2.ZERO;
        }

        const direction = toPlayer.scale(1 / distance);

        if (distance <= this.stopDistance) {
            return Vec2.ZERO;
        }

        const speedRatio = Math.min(1, (distance - this.stopDistance) / this.arriveRadius);
        const targetSpeed = this.maxSpeed * speedRatio;

        const forwardVelocity = direction.scaled(targetSpeed);
        const perpendicular = new Vec2(-direction.y, direction.x);
        const wave = Math.sin(this.elapsed * this.waveFrequency + this.phase);
        const waveVelocity = perpendicular.scaled(wave * this.waveStrength * speedRatio);

        return forwardVelocity.add(waveVelocity);
    }

    private getHoverAcceleration(): Vec2 {
        const waveX = Math.sin(this.elapsed * this.hoverFrequency + this.phase);
        const waveY = Math.cos(this.elapsed * this.hoverFrequency * 0.75 + this.phase * 1.3);

        return new Vec2(
            waveX * this.hoverStrength,
            waveY * this.hoverStrength * 0.65
        );
    }

    private limitVector(vector: Vec2, maxMagnitude: number): void {
        if (vector.magSq() <= maxMagnitude * maxMagnitude) {
            return;
        }

        vector.scaleTo(maxMagnitude);
    }

    private playFacingAnimation(): void {
        const toPlayer = this.owner.position.vecTo(this.player.position);
        const animation = toPlayer.x < 0 ? "IDLE_LEFT" : "IDLE_RIGHT";
        this.owner.animation.playIfNotAlready(animation, true);
    }
}
