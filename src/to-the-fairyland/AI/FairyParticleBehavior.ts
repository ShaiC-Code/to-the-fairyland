import AI from "../../Wolfie2D/DataTypes/Interfaces/AI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";

export type FairyParticleSettings = Readonly<{
    lifetimeMin: number;
    lifetimeMax: number;
    fadeInSeconds: number;
    fadeOutSeconds: number;
    startScaleMin: number;
    startScaleMax: number;
    endScaleMin: number;
    endScaleMax: number;
    alphaMin: number;
    alphaMax: number;
    trailSpeedMin: number;
    trailSpeedMax: number;
    riseSpeedMin: number;
    riseSpeedMax: number;
    sidewaysSpeedMin: number;
    sidewaysSpeedMax: number;
    damping: number;
    wobbleAmplitudeMin: number;
    wobbleAmplitudeMax: number;
    wobbleFrequencyMin: number;
    wobbleFrequencyMax: number;
    shineFrequencyMin: number;
    shineFrequencyMax: number;
    shineAlphaPulse: number;
    shineScalePulse: number;
}>;

export const defaultFairyParticleSettings: FairyParticleSettings = {
    lifetimeMin: 0.55,
    lifetimeMax: 1.05,
    fadeInSeconds: 0.08,
    fadeOutSeconds: 0.45,
    startScaleMin: 0.26,
    startScaleMax: 0.55,
    endScaleMin: 0.05,
    endScaleMax: 0.16,
    alphaMin: 0.38,
    alphaMax: 0.82,
    trailSpeedMin: 12,
    trailSpeedMax: 42,
    riseSpeedMin: 6,
    riseSpeedMax: 28,
    sidewaysSpeedMin: -18,
    sidewaysSpeedMax: 18,
    damping: 1.15,
    wobbleAmplitudeMin: 2,
    wobbleAmplitudeMax: 8,
    wobbleFrequencyMin: 2.2,
    wobbleFrequencyMax: 5.4,
    shineFrequencyMin: 7,
    shineFrequencyMax: 13,
    shineAlphaPulse: 0.22,
    shineScalePulse: 0.08
};

export default class FairyParticleBehavior implements AI {
    private owner!: Sprite;
    private settings: FairyParticleSettings = defaultFairyParticleSettings;

    private velocity = Vec2.ZERO;
    private age = 0;
    private lifetime = 1;
    private startScale = 1;
    private endScale = 0.2;
    private maxAlpha = 1;
    private wobbleAmplitude = 0;
    private wobbleFrequency = 0;
    private wobblePhase = 0;
    private shineFrequency = 0;
    private shinePhase = 0;

    public initializeAI(owner: Sprite, options: Record<string, any>): void {
        this.owner = owner;
        this.settings = options.settings ?? this.settings;
        this.owner.visible = false;
        this.owner.alpha = 0;
    }

    public destroy(): void {}

    public activate(options: Record<string, any>): void {
        if (options.settings) {
            this.settings = options.settings;
        }

        const origin = options.origin as Vec2;
        const sourceVelocity = (options.sourceVelocity as Vec2 | undefined) ?? Vec2.ZERO;
        const spawnSpread = options.spawnSpread ?? 10;

        this.age = 0;
        this.lifetime = this.randomBetween(this.settings.lifetimeMin, this.settings.lifetimeMax);
        this.startScale = this.randomBetween(this.settings.startScaleMin, this.settings.startScaleMax);
        this.endScale = this.randomBetween(this.settings.endScaleMin, this.settings.endScaleMax);
        this.maxAlpha = this.randomBetween(this.settings.alphaMin, this.settings.alphaMax);

        this.wobbleAmplitude = this.randomBetween(this.settings.wobbleAmplitudeMin, this.settings.wobbleAmplitudeMax);
        this.wobbleFrequency = this.randomBetween(this.settings.wobbleFrequencyMin, this.settings.wobbleFrequencyMax);
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.shineFrequency = this.randomBetween(this.settings.shineFrequencyMin, this.settings.shineFrequencyMax);
        this.shinePhase = Math.random() * Math.PI * 2;

        const trailDirection = this.getTrailDirection(sourceVelocity);
        const trailSpeed = this.randomBetween(this.settings.trailSpeedMin, this.settings.trailSpeedMax);
        const riseSpeed = this.randomBetween(this.settings.riseSpeedMin, this.settings.riseSpeedMax);
        const sidewaysSpeed = this.randomBetween(this.settings.sidewaysSpeedMin, this.settings.sidewaysSpeedMax);
        const sideways = new Vec2(-trailDirection.y, trailDirection.x);

        this.velocity = trailDirection
            .scaled(trailSpeed)
            .add(sideways.scaled(sidewaysSpeed))
            .add(new Vec2(0, -riseSpeed));

        this.owner.position.set(
            origin.x + this.randomBetween(-spawnSpread, spawnSpread),
            origin.y + this.randomBetween(-spawnSpread, spawnSpread)
        );
        this.owner.scale.set(this.startScale, this.startScale);
        this.owner.alpha = 0;
        this.owner.setSortTile(null);
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

        this.owner.position.x += (this.velocity.x + wobble) * deltaT;
        this.owner.position.y += this.velocity.y * deltaT;
        this.velocity.scale(Math.max(0, 1 - this.settings.damping * deltaT));

        const shine = 1 + Math.sin(this.age * this.shineFrequency + this.shinePhase) * this.settings.shineAlphaPulse;
        const scalePulse = 1 + Math.sin(this.age * this.shineFrequency + this.shinePhase) * this.settings.shineScalePulse;
        const scale = this.lerp(this.startScale, this.endScale, t) * scalePulse;

        this.owner.scale.set(scale, scale);
        this.owner.alpha = Math.min(1, this.getFadeAlpha() * this.maxAlpha * shine);
    }

    public isAlive(): boolean {
        return this.owner.visible;
    }

    private getTrailDirection(sourceVelocity: Vec2): Vec2 {
        if (sourceVelocity.magSq() > 0.001) {
            return sourceVelocity.normalized().scale(-1);
        }

        const angle = Math.random() * Math.PI * 2;
        return new Vec2(Math.cos(angle), Math.sin(angle));
    }

    private getFadeAlpha(): number {
        if (this.age < this.settings.fadeInSeconds) {
            return this.age / this.settings.fadeInSeconds;
        }

        const fadeOutStart = this.lifetime - this.settings.fadeOutSeconds;

        if (this.age > fadeOutStart) {
            return Math.max(0, (this.lifetime - this.age) / this.settings.fadeOutSeconds);
        }

        return 1;
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }

    private randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}
