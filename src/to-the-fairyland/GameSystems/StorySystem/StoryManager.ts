import GameSessionManager from "../GameSessionSystem/GameSessionManager";
import Chapter1StoryManager from "./Chapter1/Chapter1StoryManager";
import Chapter2StoryManager from "./Chapter2/Chapter2StoryManager";
import Chapter3StoryManager from "./Chapter3/Chapter3StoryManager";
import Chapter4StoryManager from "./Chapter4/Chapter4StoryManager";
import {
    ActiveChapter,
    StoryState,
    createInitialChapter2State,
    createInitialChapter3State,
    createInitialChapter4State
} from "./StoryState";
import { getTimeOfDayForStory } from "./StoryRules";


export default class StoryManager {
    private static instance: StoryManager | null = null;

    /** Shared owner of the live session data. */
    private readonly gameSessionManager: GameSessionManager;

    public readonly chapter1: Chapter1StoryManager;
    public readonly chapter2: Chapter2StoryManager;
    public readonly chapter3: Chapter3StoryManager;
    public readonly chapter4: Chapter4StoryManager;

    private constructor() {
        this.gameSessionManager = GameSessionManager.getInstance();

        this.chapter1 = new Chapter1StoryManager(
            () => this.getState(),
            () => this.syncWorldStateFromStory()
        );

        this.chapter2 = new Chapter2StoryManager(
            () => this.getState(),
            () => this.syncWorldStateFromStory()
        );

        this.chapter3 = new Chapter3StoryManager(
            () => this.getState(),
            () => this.syncWorldStateFromStory()
        );

        this.chapter4 = new Chapter4StoryManager(
            () => this.getState(),
            () => this.syncWorldStateFromStory()
        );
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
     * Read-only view of the story state for UI or scene checks.
     */
    public getStoryState(): Readonly<StoryState> {
        return this.getState();
    }
    
    private getState(): StoryState {
        return this.gameSessionManager.getStoryState();
    }

    public unlockChapter2(): void {
        const state = this.getState();

        if (!state.chapter2) {
            state.chapter2 = createInitialChapter2State();
        }

        state.activeChapter = ActiveChapter.CHAPTER2;
        this.syncWorldStateFromStory();
    }

    public unlockChapter3(): void {
        const state = this.getState();
    
        if (!state.chapter3) {
            state.chapter3 = createInitialChapter3State();
        }
    
        state.activeChapter = ActiveChapter.CHAPTER3;
        this.syncWorldStateFromStory();
    }

    public unlockChapter4(): void {
        const state = this.getState();
    
        if (!state.chapter4) {
            state.chapter4 = createInitialChapter4State();
        }
    
        state.activeChapter = ActiveChapter.CHAPTER4;
        this.syncWorldStateFromStory();
    }
    

    private syncWorldStateFromStory(): void {
        const session = this.gameSessionManager.requireCurrentSession();
        session.world.timeOfDay = getTimeOfDayForStory(session.story);
    }
    
}
