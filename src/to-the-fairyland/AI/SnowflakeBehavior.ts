import AI from "../../Wolfie2D/DataTypes/Interfaces/AI";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";


export type SnowflakeSettings = Readonly<{
    spawnPadding: number;
    recyclePadding: number;
    inflowEpsilon: number;
    baseSpeedMin: number;
    baseSpeedMax: number;
    angleMinDegrees: number;
    angleMaxDegrees: number;    
    wobbleAmplitudeMin: number;
    wobbleAmplitudeMax: number;
    wobbleFrequencyMin: number;
    wobbleFrequencyMax: number;
}>;

export default class SnowflakeBehavior implements AI {
    private owner: Sprite;
    private viewport: Viewport;
    private settings: SnowflakeSettings;

    private fallSpeed: number;
    private windSpeed: number;
    private wobbleAmplitude: number;
    private wobbleFrequency: number;
    private phaseOffset: number;
    private elapsed = 0;

    public initializeAI(owner: Sprite, options: Record<string, any>): void {
        this.owner = owner;
        this.viewport = options.viewport;
        this.settings = { ...options.settings };
        this.randomize();
    }

    public destroy(): void {}

    public activate(options: Record<string, any>): void {
        if (options?.settings) {
            this.settings = { ...options.settings };
        }
    }

    public handleEvent(_event: GameEvent): void {}

    public update(deltaT: number): void {
        if (!this.owner.visible) return;

        this.elapsed += deltaT;

        const vx = this.getHorizontalVelocity();
        const vy = this.fallSpeed;

        this.owner.position.x += vx * deltaT;
        this.owner.position.y += vy * deltaT;

        const center = this.viewport.getCenter();
        const halfSize = this.viewport.getHalfSize();

        const left = center.x - halfSize.x;
        const right = center.x + halfSize.x;
        const top = center.y - halfSize.y;
        const bottom = center.y + halfSize.y;

        const outOfVerticalBounds =
            this.owner.position.y < top - this.settings.recyclePadding ||
            this.owner.position.y > bottom + this.settings.recyclePadding;

        const outOfHorizontalBounds =
            this.owner.position.x < left - this.settings.recyclePadding ||
            this.owner.position.x > right + this.settings.recyclePadding;

        if (outOfVerticalBounds || outOfHorizontalBounds) {
            this.respawnAtInflowEdge();
        }
    }

    public respawnAtInflowEdge(): void {
        this.randomize();

        const center = this.viewport.getCenter();
        const halfSize = this.viewport.getHalfSize();
        const cameraVelocity = this.viewport.getVelocity();

        const left = center.x - halfSize.x;
        const right = center.x + halfSize.x;
        const top = center.y - halfSize.y;
        const bottom = center.y + halfSize.y;

        const width = halfSize.x * 2;
        const height = halfSize.y * 2;

        const relativeVx = this.windSpeed - cameraVelocity.x;
        const relativeVy = this.fallSpeed - cameraVelocity.y;

        const leftWeight = relativeVx > this.settings.inflowEpsilon ? relativeVx * height : 0;
        const rightWeight = relativeVx < -this.settings.inflowEpsilon ? -relativeVx * height : 0;
        const topWeight = relativeVy > this.settings.inflowEpsilon ? relativeVy * width : 0;
        const bottomWeight = relativeVy < -this.settings.inflowEpsilon ? -relativeVy * width : 0;

        const totalWeight = leftWeight + rightWeight + topWeight + bottomWeight;
        const padding = this.settings.spawnPadding;

        if (totalWeight <= 0) {
            this.owner.position.set(
                left - padding + Math.random() * (width + padding * 2),
                top - Math.random() * padding
            );
            return;
        }

        let pick = Math.random() * totalWeight;

        if (pick < leftWeight) {
            this.owner.position.set(
                left - Math.random() * padding,
                top - padding + Math.random() * (height + padding * 2)
            );
            return;
        }
        pick -= leftWeight;

        if (pick < rightWeight) {
            this.owner.position.set(
                right + Math.random() * padding,
                top - padding + Math.random() * (height + padding * 2)
            );
            return;
        }
        pick -= rightWeight;

        if (pick < topWeight) {
            this.owner.position.set(
                left - padding + Math.random() * (width + padding * 2),
                top - Math.random() * padding
            );
            return;
        }

        this.owner.position.set(
            left - padding + Math.random() * (width + padding * 2),
            bottom + Math.random() * padding
        );
    }
    

    /** Scatter uniformly over the current camera view for the initial pool fill. */
    public scatterOnScreen(): void {
        this.randomize();

        const center = this.viewport.getCenter();
        const halfSize = this.viewport.getHalfSize();
        const padding = this.settings.spawnPadding;

        const left = center.x - halfSize.x - padding;
        const top = center.y - halfSize.y - padding;
        const width = halfSize.x * 2 + padding * 2;
        const height = halfSize.y * 2 + padding * 2;

        this.owner.position.set(
            left + Math.random() * width,
            top + Math.random() * height
        );
    }

    private randomize(): void {
        const speed = this.randomBetween(this.settings.baseSpeedMin, this.settings.baseSpeedMax);
        const angleDegrees = this.randomBetween(this.settings.angleMinDegrees, this.settings.angleMaxDegrees);
        const angleRadians = angleDegrees * Math.PI / 180;
    
        // 0 degrees means straight down.
        this.windSpeed = Math.sin(angleRadians) * speed;
        this.fallSpeed = Math.cos(angleRadians) * speed;
    
        this.wobbleAmplitude = this.randomBetween(this.settings.wobbleAmplitudeMin, this.settings.wobbleAmplitudeMax);
        this.wobbleFrequency = this.randomBetween(this.settings.wobbleFrequencyMin, this.settings.wobbleFrequencyMax);
        this.phaseOffset = Math.random() * Math.PI * 2;
        this.elapsed = 0
    }

    private randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    private getHorizontalVelocity(): number {
        return this.windSpeed
            + this.wobbleAmplitude * Math.sin(this.wobbleFrequency * this.elapsed + this.phaseOffset);
    }
}
