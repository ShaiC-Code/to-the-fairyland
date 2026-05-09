import PlayerActor from "../../Actors/PlayerActor";
import PlayerStateManager from "./PlayerStateManager";

export type PlayerDamageOptions = {
    ignoreCooldown?: boolean;
    cooldownSeconds?: number;
    playHurtFeedback?: boolean;
    source?: string;
};

type PlayerHealthControllerOptions = {
    player: PlayerActor;
    playerStateManager: PlayerStateManager;
    defaultDamageCooldownSeconds?: number;
    playHurtFeedback?: () => void;
    onDeath?: () => void;
};

export default class PlayerHealthController {
    private readonly player: PlayerActor;
    private readonly playerStateManager: PlayerStateManager;
    private readonly defaultDamageCooldownSeconds: number;
    private readonly playHurtFeedback?: () => void;
    private readonly onDeath?: () => void;

    private damageCooldownRemaining = 0;
    private deathSequenceStarted = false;

    public constructor(options: PlayerHealthControllerOptions) {
        this.player = options.player;
        this.playerStateManager = options.playerStateManager;
        this.defaultDamageCooldownSeconds = options.defaultDamageCooldownSeconds ?? 0.75;
        this.playHurtFeedback = options.playHurtFeedback;
        this.onDeath = options.onDeath;
    }

    public update(deltaT: number): void {
        this.damageCooldownRemaining = Math.max(0, this.damageCooldownRemaining - deltaT);
    }

    public takeDamage(amount: number, options: PlayerDamageOptions = {}): boolean {
        if (amount <= 0 || this.deathSequenceStarted) {
            return false;
        }

        if (!options.ignoreCooldown && this.damageCooldownRemaining > 0) {
            return false;
        }

        const healthChanged = this.setHealth(this.player.health - amount);

        if (!healthChanged) {
            return false;
        }

        if (this.player.health <= 0) {
            this.startDeathSequence();
            return true;
        }

        if (options.playHurtFeedback !== false) {
            this.playHurtFeedback?.();
        }

        if (!options.ignoreCooldown) {
            this.damageCooldownRemaining = options.cooldownSeconds ?? this.defaultDamageCooldownSeconds;
        }

        return true;
    }

    public heal(amount: number): boolean {
        if (amount <= 0 || this.deathSequenceStarted) {
            return false;
        }

        return this.setHealth(this.player.health + amount);
    }

    public setHealth(value: number): boolean {
        const maxHealth = Math.max(1, this.player.maxHealth);
        const nextHealth = Math.max(0, Math.min(value, maxHealth));
        const previousHealth = this.player.health;

        this.player.health = nextHealth;
        this.playerStateManager.setHealth(nextHealth);

        if (nextHealth <= 0) {
            this.startDeathSequence();
        }

        return previousHealth !== nextHealth;
    }

    public getDamageCooldownRemaining(): number {
        return this.damageCooldownRemaining;
    }

    public isDead(): boolean {
        return this.player.health <= 0 || this.deathSequenceStarted;
    }

    public hasStartedDeathSequence(): boolean {
        return this.deathSequenceStarted;
    }

    private startDeathSequence(): void {
        if (this.deathSequenceStarted) {
            return;
        }

        this.deathSequenceStarted = true;
        this.damageCooldownRemaining = 0;
        this.onDeath?.();
    }
}
