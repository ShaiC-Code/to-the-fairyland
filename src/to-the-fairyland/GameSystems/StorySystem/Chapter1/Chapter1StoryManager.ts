import { Chapter1MainQuestStep, Chapter1StoryState, StoryState } from "../StoryState";

type GetStoryState = () => StoryState;
type SyncWorldState = () => void;

export default class Chapter1StoryManager {
    public constructor(
        private readonly getStoryState: GetStoryState,
        private readonly syncWorldState: SyncWorldState
    ) {}

    public getMainQuestStep(): Chapter1MainQuestStep {
        return this.getState().mainQuestStep;
    }

    public canSleep(): boolean {
        return this.getState().mainQuestStep === Chapter1MainQuestStep.RETURN_TO_BED;
    }

    public markFoodFound(): void {
        const state = this.getState();

        if (state.mainQuestStep === Chapter1MainQuestStep.NEED_FOOD) {
            state.mainQuestStep = Chapter1MainQuestStep.NEED_TO_COOK;
            this.syncWorldState();
        }
    }

    public markFoodCooked(): void {
        const state = this.getState();

        if (state.mainQuestStep === Chapter1MainQuestStep.NEED_TO_COOK) {
            state.mainQuestStep = Chapter1MainQuestStep.NEED_TO_EAT;
            this.syncWorldState();
        }
    }

    public markFoodConsumed(): void {
        const state = this.getState();

        if (state.mainQuestStep === Chapter1MainQuestStep.NEED_TO_EAT) {
            state.mainQuestStep = Chapter1MainQuestStep.RETURN_TO_BED;
            this.syncWorldState();
        }
    }

    public markSlept(): void {
        const state = this.getState();

        if (state.mainQuestStep === Chapter1MainQuestStep.RETURN_TO_BED) {
            state.mainQuestStep = Chapter1MainQuestStep.SLEPT;
            this.syncWorldState();
        }
    }

    public markMapPickedUp(): void {
        const state = this.getState();

        if (state.mainQuestStep === Chapter1MainQuestStep.SLEPT) {
            state.mainQuestStep = Chapter1MainQuestStep.MAP_PICKED;
            this.syncWorldState();
        }
    }

    private getState(): Chapter1StoryState {
        return this.getStoryState().chapter1;
    }
}