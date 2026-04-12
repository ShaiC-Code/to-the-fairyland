import GameSessionManager from "../GameSessionSystem/GameSessionManager";
import { PlayerState } from "./PlayerState";

/**
 * Handles player-specific access and helper operations.
 * The actual player data now lives inside GameSessionManager's current session.
 */
export default class PlayerStateManager {
    private static instance: PlayerStateManager | null = null;

    /** Shared owner of the live session data. */
    private readonly gameSessionManager: GameSessionManager;

    private constructor() {
        this.gameSessionManager = GameSessionManager.getInstance();
    }

    /**
     * Returns the shared player-state manager.
     */
    public static getInstance(): PlayerStateManager {
        if (!PlayerStateManager.instance) {
            PlayerStateManager.instance = new PlayerStateManager();
        }

        return PlayerStateManager.instance;
    }

    /**
     * Returns the active player state from the current game session.
     * Throws if gameplay starts before a session has been created.
     */
    private getState(): PlayerState {
        return this.gameSessionManager.getPlayerState();
    }

    /**
     * Returns the persistent player data object.
     * Scenes can use this to hydrate a newly spawned PlayerActor.
     */
    public getPlayerState(): PlayerState {
        return this.getState();
    }

    /** Updates the displayed player name. */
    public setName(name: string): void {
        this.getState().name = name;
    }

    /**
     * Sets max health and clamps current health so the two stay valid together.
     */
    public setMaxHealth(value: number): void {
        const state = this.getState();
        state.maxHealth = Math.max(1, value);
        state.health = Math.min(state.health, state.maxHealth);
    }

    /**
     * Sets current health while keeping it between 0 and maxHealth.
     */
    public setHealth(value: number): void {
        const state = this.getState();
        state.health = Math.max(0, Math.min(value, state.maxHealth));
    }

    /** Convenience helper for healing effects. */
    public heal(amount: number): void {
        const state = this.getState();
        this.setHealth(state.health + amount);
    }

    /** Convenience helper for damage effects. */
    public damage(amount: number): void {
        const state = this.getState();
        this.setHealth(state.health - amount);
    }
}
