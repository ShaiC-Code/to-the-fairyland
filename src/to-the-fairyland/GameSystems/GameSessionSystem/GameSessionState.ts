import { StoryState, createInitialStoryState } from "../StorySystem/StoryState";
import { PlayerState, createInitialPlayerState } from "../PlayerSystem/PlayerState";
import { WorldState, createInitialWorldState } from "../WorldSystem/WorldState";

/**
 * Root state for one active play session.
 * Grouping player and story here gives the game one cross-scene source of truth.
 */
export interface GameSessionState {
    /** Persistent player progression and stats. */
    player: PlayerState;

    /** Persistent story and quest progression. */
    story: StoryState;

    /** State of the World in daytime | weather */
    world: WorldState;
}

/**
 * Creates a fresh game session containing every piece of state
 * that should persist while the player moves across scenes.
 */
export function createInitialGameSessionState(): GameSessionState {
    return {
        player: createInitialPlayerState(),
        story: createInitialStoryState(),
        world: createInitialWorldState()
    };
}
