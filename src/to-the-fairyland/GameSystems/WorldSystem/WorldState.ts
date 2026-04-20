export enum TimeOfDay {
    DAY,
    NOON,
    DUSK,
    NIGHT
}

export enum WeatherType {
    NONE,
    SNOW,
    SNOWSTORM
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
export function createInitialWorldState(timeOfDay: TimeOfDay = TimeOfDay.DAY): WorldState {
    return {
        timeOfDay
    };
}