import Inventory from "../ItemSystem/Inventory";

/**
 * Persistent player-owned data that should survive scene changes.
 * This is pure session data, not the runtime PlayerActor or PlayerAI.
 */
export interface PlayerState {
    /** Name shown in UI like the inventory screen. */
    name: string;

    /** Current health carried across scenes. */
    health: number;

    /** Max health used for clamping and UI display. */
    maxHealth: number;

    /**
     * Shared runtime inventory for the current play session.
     * Any scene can read this same object and see the same items.
     */
    inventory: Inventory;
}

/**
 * Creates the default player data for a brand-new game.
 * Keep all new-run defaults here so reset logic stays centralized.
 */
export function createInitialPlayerState(): PlayerState {
    return {
        name: "FATE",
        health: 100,
        maxHealth: 100,
        inventory: new Inventory()
    };
}