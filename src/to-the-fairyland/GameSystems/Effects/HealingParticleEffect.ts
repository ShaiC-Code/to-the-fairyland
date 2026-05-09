import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../../Wolfie2D/Scene/Scene";
import FairyParticleBehavior, {
    defaultFairyParticleSettings,
    FairyParticleSettings
} from "../../AI/FairyParticleBehavior";

export type HealingParticleEffectOptions = {
    poolSize?: number;
    particlesPerBurst?: number;
    spawnSpread?: number;
    settings?: Partial<FairyParticleSettings>;
};

export type HealingParticleBurstOptions = {
    particlesPerBurst?: number;
    spawnSpread?: number;
    sourceVelocity?: Vec2;
    settings?: Partial<FairyParticleSettings>;
};

export const defaultHealingParticleSettings: FairyParticleSettings = {
    ...defaultFairyParticleSettings,
    lifetimeMin: 0.55,
    lifetimeMax: 0.95,
    fadeInSeconds: 0.06,
    fadeOutSeconds: 0.38,
    startScaleMin: 0.45,
    startScaleMax: 0.85,
    endScaleMin: 0.12,
    endScaleMax: 0.28,
    alphaMin: 0.55,
    alphaMax: 0.95,
    trailSpeedMin: 0,
    trailSpeedMax: 18,
    riseSpeedMin: 34,
    riseSpeedMax: 74,
    sidewaysSpeedMin: -30,
    sidewaysSpeedMax: 30,
    damping: 0.9,
    wobbleAmplitudeMin: 3,
    wobbleAmplitudeMax: 10,
    wobbleFrequencyMin: 2.5,
    wobbleFrequencyMax: 6.2,
    shineAlphaPulse: 0.16,
    shineScalePulse: 0.05
};

export default class HealingParticleEffect {
    private readonly scene: Scene;
    private readonly layerName: string;
    private readonly spriteKey: string;
    private readonly particles: Sprite[] = [];
    private readonly poolSize: number;
    private readonly particlesPerBurst: number;
    private readonly spawnSpread: number;
    private readonly settings: FairyParticleSettings;

    public constructor(
        scene: Scene,
        layerName: string,
        spriteKey: string,
        options: HealingParticleEffectOptions = {}
    ) {
        this.scene = scene;
        this.layerName = layerName;
        this.spriteKey = spriteKey;
        this.poolSize = options.poolSize ?? 90;
        this.particlesPerBurst = options.particlesPerBurst ?? 6;
        this.spawnSpread = options.spawnSpread ?? 28;
        this.settings = {
            ...defaultHealingParticleSettings,
            ...(options.settings ?? {})
        };

        this.setupParticlePool();
    }

    public spawnBurst(origin: Vec2, options: HealingParticleBurstOptions = {}): void {
        const settings = {
            ...this.settings,
            ...(options.settings ?? {})
        };
        const particlesPerBurst = options.particlesPerBurst ?? this.particlesPerBurst;
        const spawnSpread = options.spawnSpread ?? this.spawnSpread;
        const sourceVelocity = options.sourceVelocity ?? Vec2.ZERO;

        for (let i = 0; i < particlesPerBurst; i++) {
            const particle = this.particles.find(candidate => !candidate.visible);

            if (!particle) {
                return;
            }

            const particleAI = particle.ai as FairyParticleBehavior;
            particleAI.activate({
                origin,
                sourceVelocity,
                spawnSpread,
                settings
            });
        }
    }

    private setupParticlePool(): void {
        for (let i = 0; i < this.poolSize; i++) {
            const particle = this.scene.add.sprite(
                this.spriteKey,
                this.layerName
            );

            particle.visible = false;
            particle.alpha = 0;
            particle.addAI(FairyParticleBehavior, {
                settings: this.settings
            });

            this.particles.push(particle);
        }
    }
}
