export enum TimeOfDay {
    DAY,
    NOON,
    DUSK,
    NIGHT
}

/**
 * Shared world-level state that should persist across scene changes.
 * This is separate from story progression and player stats.
 */
export interface WorldState {
    timeOfDay: TimeOfDay;
}

/**
 * Default world state for a brand-new run.
 */
export function createInitialWorldState(): WorldState {
    return {
        timeOfDay: TimeOfDay.DUSK
    };
}