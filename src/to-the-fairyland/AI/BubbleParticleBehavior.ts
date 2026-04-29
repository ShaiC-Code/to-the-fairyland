import AI from "../../Wolfie2D/DataTypes/Interfaces/AI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";

export type BubbleParticleSettings = Readonly<{
    lifetimeMin: number;
    lifetimeMax: number;
    fadeInSeconds: number;
    fadeOutSeconds: number;
    riseSpeedMin: number;
    riseSpeedMax: number;
    fanSpeedMin: number;
    fanSpeedMax: number;
    fanAccelerationMin: number;
    fanAccelerationMax: number;
    wobbleAmplitudeMin: number;
    wobbleAmplitudeMax: number;
    wobbleFrequencyMin: number;
    wobbleFrequencyMax: number;
    scaleMin: number;
    scaleMax: number;
    scaleGrowth: number;
}>;

export default class BubbleParticleBehavior implements AI {
    private owner!: Sprite;
    private settings!: BubbleParticleSettings;

    private age = 0;
    private lifetime = 1;
    private riseSpeed = 0;
    private fanSpeed = 0;
    private fanAcceleration = 0;
    private wobbleAmplitude = 0;
    private wobbleFrequency = 0;
    private wobblePhase = 0;
    private startScale = 1;
    private maxAlpha = 1;

    public initializeAI(owner: Sprite, options: Record<string, any>): void {
        this.owner = owner;
        this.settings = { ...options.settings };
        this.owner.visible = false;
        this.owner.alpha = 0;
    }

    public destroy(): void {}

    public activate(options: Record<string, any>): void {
        if (options.settings) {
            this.settings = { ...options.settings };
        }

        const origin = options.origin as Vec2;
        const tileSize = options.tileSize as Vec2;

        this.age = 0;
        this.lifetime = this.randomBetween(this.settings.lifetimeMin, this.settings.lifetimeMax);
        this.riseSpeed = this.randomBetween(this.settings.riseSpeedMin, this.settings.riseSpeedMax);

        const fanDirection = Math.random() < 0.5 ? -1 : 1;
        this.fanSpeed = fanDirection * this.randomBetween(this.settings.fanSpeedMin, this.settings.fanSpeedMax);
        this.fanAcceleration = fanDirection * this.randomBetween(this.settings.fanAccelerationMin, this.settings.fanAccelerationMax);

        this.wobbleAmplitude = this.randomBetween(this.settings.wobbleAmplitudeMin, this.settings.wobbleAmplitudeMax);
        this.wobbleFrequency = this.randomBetween(this.settings.wobbleFrequencyMin, this.settings.wobbleFrequencyMax);
        this.wobblePhase = Math.random() * Math.PI * 2;

        const scaleMultiplier = options.scaleMultiplier ?? 1;
        this.maxAlpha = options.maxAlpha ?? 1;

        this.startScale = this.randomBetween(this.settings.scaleMin, this.settings.scaleMax) * scaleMultiplier;
        this.owner.scale.set(this.startScale, this.startScale);

        this.owner.position.set(
            origin.x + (Math.random() - 0.5) * tileSize.x,
            origin.y + (Math.random() - 0.5) * tileSize.y
        );

        this.owner.alpha = 0;
        this.owner.visible = true;
    }

    public handleEvent(_event: GameEvent): void {}

    public update(deltaT: number): void {
        if (!this.owner.visible) {
            return;
        }

        this.age += deltaT;

        if (this.age >= this.lifetime) {
            this.owner.visible = false;
            this.owner.alpha = 0;
            return;
        }

        const t = this.age / this.lifetime;
        const wobble = Math.sin(this.age * this.wobbleFrequency + this.wobblePhase) * this.wobbleAmplitude;
        const fan = this.fanSpeed + this.fanAcceleration * t;

        this.owner.position.x += (fan + wobble) * deltaT;
        this.owner.position.y -= this.riseSpeed * (1 + t * 0.35) * deltaT;

        const scale = this.startScale + this.settings.scaleGrowth * t;
        this.owner.scale.set(scale, scale);
        this.owner.alpha = this.getAlpha() * this.maxAlpha;
    }

    private getAlpha(): number {
        if (this.age < this.settings.fadeInSeconds) {
            return this.age / this.settings.fadeInSeconds;
        }

        const fadeOutStart = this.lifetime - this.settings.fadeOutSeconds;
        if (this.age > fadeOutStart) {
            return Math.max(0, (this.lifetime - this.age) / this.settings.fadeOutSeconds);
        }

        return 1;
    }

    private randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}
