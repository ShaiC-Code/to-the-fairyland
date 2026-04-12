import GameSessionManager from "../GameSessionSystem/GameSessionManager";
import { Chapter1MainQuestStep, StoryState } from "./StoryState";

/**
 * Handles story-specific queries and progression rules.
 * The actual story data now lives inside GameSessionManager's current session.
 */
export default class StoryManager {
    private static instance: StoryManager | null = null;

    /** Shared owner of the live session data. */
    private readonly gameSessionManager: GameSessionManager;

    private constructor() {
        this.gameSessionManager = GameSessionManager.getInstance();
    }

    /**
     * Returns the shared story manager.
     */
    public static getInstance(): StoryManager {
        if (!StoryManager.instance) {
            StoryManager.instance = new StoryManager();
        }

        return StoryManager.instance;
    }

    /**
     * Returns the active story state from the current game session.
     * Throws if gameplay starts before a session has been created.
     */
    private getState(): StoryState {
        return this.gameSessionManager.getStoryState();
    }

    /**
     * Read-only view of the story state for UI or scene checks.
     */
    public getStoryState(): Readonly<StoryState> {
        return this.getState();
    }

    /**
     * Convenience accessor so scenes do not need to know the exact
     * nested shape of chapter 1 story data.
     */
    public getChapter1MainQuestStep(): Chapter1MainQuestStep {
        return this.getState().chapter1.mainQuestStep;
    }

    /**
     * Advances the quest once the player has successfully found food.
     */
    public markFoodFound(): void {
        const state = this.getState();

        if (state.chapter1.mainQuestStep === Chapter1MainQuestStep.NEED_FOOD) {
            state.chapter1.mainQuestStep = Chapter1MainQuestStep.NEED_TO_COOK;
        }
    }

    /**
     * Advances the quest once the player has successfully cooked.
     */
    public markFoodCooked(): void {
        const state = this.getState();

        if (state.chapter1.mainQuestStep === Chapter1MainQuestStep.NEED_TO_COOK) {
            state.chapter1.mainQuestStep = Chapter1MainQuestStep.NEED_TO_EAT;
        }
    }

    /**
     * Advances the quest once the player has successfully consumed food.
     */
    public markFoodConsumed(): void {
        const state = this.getState();

        if (state.chapter1.mainQuestStep === Chapter1MainQuestStep.NEED_TO_EAT) {
            state.chapter1.mainQuestStep = Chapter1MainQuestStep.RETURN_TO_BED;
        }
    }

    /**
     * Returns whether the player is currently allowed to sleep.
     */
    public canSleep(): boolean {
        return this.getState().chapter1.mainQuestStep === Chapter1MainQuestStep.RETURN_TO_BED;
    }

    /**
     * Advances the quest after the player rests in bed.
     */
    public markSlept(): void {
        const state = this.getState();

        if (state.chapter1.mainQuestStep === Chapter1MainQuestStep.RETURN_TO_BED) {
            state.chapter1.mainQuestStep = Chapter1MainQuestStep.SLEPT;
        }
    }

    public markMapPickedUp(): void {
        const state = this.getState();

        if (state.chapter1.mainQuestStep === Chapter1MainQuestStep.SLEPT) {
            state.chapter1.mainQuestStep = Chapter1MainQuestStep.MAP_PICKED;
        }
    }
}
