import { PlayerState, createInitialPlayerState } from "../PlayerSystem/PlayerState";
import {
    ActiveChapter,
    StoryState,
    createInitialChapter1State,
    createChapter1CompletedState,
    createInitialChapter2State,
    createInitialChapter4State
} from "../StorySystem/StoryState";
import { WorldState, createInitialWorldState } from "../WorldSystem/WorldState";
import { getTimeOfDayForStory } from "../StorySystem/StoryRules";

/**
 * Root state for one active play session.
 * Grouping player and story here gives the game one cross-scene source of truth.
 */
export interface GameSessionState {
    player: PlayerState;
    story: StoryState;
    world: WorldState;
}

function createGameSessionState(story: StoryState): GameSessionState {
    return {
        player: createInitialPlayerState(),
        story,
        world: createInitialWorldState(getTimeOfDayForStory(story))
    };
}

/**
 * Creates a fresh game session for a run that starts in Chapter 1.
 */
export function createInitialChapter1GameSessionState(): GameSessionState {
    return createGameSessionState({
        activeChapter: ActiveChapter.CHAPTER1,
        chapter1: createInitialChapter1State()
    });
}

/**
 * Creates a fresh game session for a run that starts in Chapter 2.
 * Chapter 1 is considered already completed enough to unlock Chapter 2.
 */
export function createInitialChapter2GameSessionState(): GameSessionState {
    return createGameSessionState({
        activeChapter: ActiveChapter.CHAPTER2,
        chapter1: createChapter1CompletedState(),
        chapter2: createInitialChapter2State()
    });
}

export function createInitialChapter4GameSessionState(): GameSessionState {
    return createGameSessionState({
        activeChapter: ActiveChapter.CHAPTER4,
        chapter1: createChapter1CompletedState(),
        chapter2: createInitialChapter2State(),
        chapter4: createInitialChapter4State()
    });
}


export function createInitialGameSessionState(): GameSessionState {
    return createInitialChapter1GameSessionState();
}