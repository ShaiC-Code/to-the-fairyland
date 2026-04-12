import { Chapter1MainQuestStep, StoryState, createInitialStoryState } from "./StoryState";

export default class StoryManager {
    private static instance: StoryManager | null = null;

    private state: StoryState;

    private constructor() {
        this.state = createInitialStoryState();
    }

    public static getInstance(): StoryManager {
        if (!StoryManager.instance) {
            StoryManager.instance = new StoryManager();
        }

        return StoryManager.instance;
    }

    public resetForNewGame(): void {
        this.state = createInitialStoryState();
    }

    public getStoryState(): Readonly<StoryState> {
        return this.state;
    }

    public getChapter1MainQuestStep(): Chapter1MainQuestStep {
        return this.state.chapter1.mainQuestStep;
    }

    public markFoodConsumed(): void {
        if (this.state.chapter1.mainQuestStep === Chapter1MainQuestStep.NEED_FOOD) {
            this.state.chapter1.mainQuestStep = Chapter1MainQuestStep.RETURN_TO_BED;
        }
    }

    public canSleep(): boolean {
        return this.state.chapter1.mainQuestStep === Chapter1MainQuestStep.RETURN_TO_BED;
    }

    public markSlept(): void {
        if (this.state.chapter1.mainQuestStep === Chapter1MainQuestStep.RETURN_TO_BED) {
            this.state.chapter1.mainQuestStep = Chapter1MainQuestStep.SLEPT;
        }
    }
}
