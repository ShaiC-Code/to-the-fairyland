import AI from "../../../../Wolfie2D/DataTypes/Interfaces/AI";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import GameNode from "../../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import PlayerActor from "../../../Actors/PlayerActor";
import FairyParticleBehavior, {
    defaultFairyParticleSettings,
    FairyParticleSettings
} from "../../FairyParticleBehavior";

export default class ToothFairyApproachBehavior implements AI {
    private owner!: AnimatedSprite;
    private player!: PlayerActor;

    private velocity = Vec2.ZERO;
    private elapsed = 0;
    private phase = 0;
    private startDelay = 2;
    private delayTimer = 0;

    private maxSpeed = 200;
    private maxAcceleration = 260;
    private drag = 0.85;

    private arriveRadius = 180;
    private stopDistance = 60;

    private waveStrength = 90;
    private waveFrequency = 1.6;

    private hoverStrength = 18;
    private hoverFrequency = 2.0;
    private minHoverSpeed = 16;

    private particleSpriteKey: string | null = null;
    private particleLayerName = "FairyParticles";
    private particlePoolSize = 28;
    private particleSpawnSpread = 10;
    private particleEmitTimer = 0;
    private particleEmitIntervalMin = 0.035;
    private particleEmitIntervalMax = 0.075;
    private particleMinMoveSpeed = 25;
    private fairyParticles: Sprite[] = [];
    private particleSettings: FairyParticleSettings = defaultFairyParticleSettings;

    public initializeAI(owner: GameNode, options: Record<string, any>): void {
        this.owner = owner as AnimatedSprite;
        this.player = options.player;

        this.startDelay = options.startDelay ?? this.startDelay;
        this.delayTimer = this.startDelay;

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

        this.particleSpriteKey = options.particleSpriteKey ?? this.particleSpriteKey;
        this.particleLayerName = options.particleLayerName ?? this.particleLayerName;
        this.particlePoolSize = options.particlePoolSize ?? this.particlePoolSize;
        this.particleSpawnSpread = options.particleSpawnSpread ?? this.particleSpawnSpread;
        this.particleEmitIntervalMin = options.particleEmitIntervalMin ?? this.particleEmitIntervalMin;
        this.particleEmitIntervalMax = options.particleEmitIntervalMax ?? this.particleEmitIntervalMax;
        this.particleMinMoveSpeed = options.particleMinMoveSpeed ?? this.particleMinMoveSpeed;
        this.particleSettings = {
            ...defaultFairyParticleSettings,
            ...(options.particleSettings ?? {})
        };

        this.phase = Math.random() * Math.PI * 2;

        const startDirection = this.owner.position.dirTo(this.player.position);
        this.velocity = startDirection.scaled(this.minHoverSpeed);
        this.setupParticlePool();

        this.playFacingAnimation();
    }

    public update(deltaT: number): void {
        this.elapsed += deltaT;
        this.updateParticleEmission(deltaT);

        if (this.delayTimer > 0) {
            this.delayTimer = Math.max(0, this.delayTimer - deltaT);
            this.playFacingAnimation();
            return;
        }

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

    private setupParticlePool(): void {
        if (!this.particleSpriteKey) {
            return;
        }

        for (let i = 0; i < this.particlePoolSize; i++) {
            const particle = this.owner.getScene().add.sprite(
                this.particleSpriteKey,
                this.particleLayerName
            );

            particle.visible = false;
            particle.alpha = 0;
            particle.addAI(FairyParticleBehavior, {
                settings: this.particleSettings
            });

            this.fairyParticles.push(particle);
        }
    }

    private updateParticleEmission(deltaT: number): void {
        if (!this.particleSpriteKey) {
            return;
        }

        this.particleEmitTimer -= deltaT;

        while (this.particleEmitTimer <= 0) {
            this.emitParticle();
            this.particleEmitTimer += this.randomBetween(
                this.particleEmitIntervalMin,
                this.particleEmitIntervalMax
            );
        }
    }

    private emitParticle(): void {
        const particle = this.fairyParticles.find(candidate => !candidate.visible);

        if (!particle) {
            return;
        }

        const particleAI = particle.ai as FairyParticleBehavior;

        particleAI.activate({
            origin: this.owner.position.clone(),
            sourceVelocity: this.getParticleSourceVelocity(),
            spawnSpread: this.particleSpawnSpread,
            settings: this.particleSettings
        });
    }

    private getParticleSourceVelocity(): Vec2 {
        if (this.velocity.magSq() < this.particleMinMoveSpeed * this.particleMinMoveSpeed) {
            return Vec2.ZERO;
        }

        return this.velocity.clone();
    }

    private randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    private playFacingAnimation(): void {
        const toPlayer = this.owner.position.vecTo(this.player.position);
        const animation = toPlayer.x < 0 ? "IDLE_LEFT" : "IDLE_RIGHT";
        this.owner.animation.playIfNotAlready(animation, true);
    }
}
