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

    private getState(): Chapter1StoryState {
        return this.getStoryState().chapter1;
    }

    public markNeedFood(): void {
        const state = this.getState();
        if (state.mainQuestStep === Chapter1MainQuestStep.NEED_FOOD) {
            state.mainQuestStep = Chapter1MainQuestStep.NEED_TO_COOK;
            this.syncWorldState();
        }
    }

    public markNeedToCook(): void {
        const state = this.getState();
        if (state.mainQuestStep === Chapter1MainQuestStep.NEED_TO_COOK) {
            state.mainQuestStep = Chapter1MainQuestStep.NEED_TO_EAT;
            this.syncWorldState();
        }
    }

    public markNeedToEat(): void {
        const state = this.getState();
        if (state.mainQuestStep === Chapter1MainQuestStep.NEED_TO_EAT) {
            state.mainQuestStep = Chapter1MainQuestStep.RETURN_TO_BED;
            this.syncWorldState();
        }
    }

    public markReturnToBed(): void {
        const state = this.getState();
        if (state.mainQuestStep === Chapter1MainQuestStep.RETURN_TO_BED) {
            state.mainQuestStep = Chapter1MainQuestStep.SLEPT;
            this.syncWorldState();
        }
    }

    public markMapPicked(): void {
        const state = this.getState();
        if (state.mainQuestStep === Chapter1MainQuestStep.SLEPT) {
            state.mainQuestStep = Chapter1MainQuestStep.MAP_PICKED;
            this.syncWorldState();
        }
    }
}