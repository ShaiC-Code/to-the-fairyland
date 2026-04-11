import AI from "../../Wolfie2D/DataTypes/Interfaces/AI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";

export default class SnowflakeBehavior implements AI {
    private owner: Sprite;

    private fallSpeed: number;
    private windSpeed: number;
    private wobbleAmplitude: number;
    private wobbleFrequency: number;
    private phaseOffset: number;
    private elapsed: number = 0;

    // The viewport area to respawn within
    private viewportSize: Vec2;
    private viewportCenter: Vec2;

    public initializeAI(owner: Sprite, options: Record<string, any>): void {
        this.owner = owner;
        this.viewportSize = options.viewportSize;
        this.viewportCenter = options.viewportCenter;
        this.randomize();
    }

    public destroy(): void {}
    public activate(options: Record<string, any>): void {}
    public handleEvent(event: GameEvent): void {}

    public update(deltaT: number): void {
        if (!this.owner.visible) return;

        this.elapsed += deltaT;

        const vx = this.windSpeed
                 + this.wobbleAmplitude * Math.sin(this.wobbleFrequency * this.elapsed + this.phaseOffset);
        const vy = this.fallSpeed;

        this.owner.position.x += vx * deltaT;
        this.owner.position.y += vy * deltaT;

        // If the flake has fallen off the bottom or drifted off the sides, respawn at top
        const halfW = this.viewportSize.x / 2 + 100;  // margin
        const bottom = this.viewportCenter.y + this.viewportSize.y / 2 + 50;

        if (this.owner.position.y > bottom
            || this.owner.position.x < this.viewportCenter.x - halfW
            || this.owner.position.x > this.viewportCenter.x + halfW) {
            this.respawnAtTop();
        }
    }

    /** Reset with new random values and place at a random position along the top edge */
    public respawnAtTop(): void {
        this.randomize();
        const top = this.viewportCenter.y - this.viewportSize.y / 2 - 50;
        const halfW = this.viewportSize.x / 2 + 50;
        this.owner.position.set(
            this.viewportCenter.x - halfW + Math.random() * (halfW * 2),
            top - Math.random() * 100
        );
    }

    /** Scatter the flake anywhere on screen (used for initial fill) */
    public scatterOnScreen(): void {
        this.randomize();
        const halfW = this.viewportSize.x / 2;
        const halfH = this.viewportSize.y / 2;
        this.owner.position.set(
            this.viewportCenter.x - halfW + Math.random() * halfW * 2,
            this.viewportCenter.y - halfH + Math.random() * halfH * 2
        );
    }

    private randomize(): void {
        this.fallSpeed = 80 + Math.random() * 120;       // 80–200 px/sec
        this.windSpeed = 30 + Math.random() * 30;         // 30–60 px/sec
        this.wobbleAmplitude = 20 + Math.random() * 40;   // 20–60
        this.wobbleFrequency = 1 + Math.random() * 2;     // 1–3 rad/sec
        this.phaseOffset = Math.random() * Math.PI * 2;   // 0–2π
        this.elapsed = 0;
    }

}