import {
    CHAPTER4_MAIN_QUEST_ORDER,
    Chapter4MainQuestStep,
    Chapter4StoryState,
    StoryState
} from "../StoryState";

type GetStoryState = () => StoryState;
type SyncWorldState = () => void;

export default class Chapter4StoryManager {
    public constructor(
        private readonly getStoryState: GetStoryState,
        private readonly syncWorldState: SyncWorldState
    ) {}

    public getMainQuestStep(): Chapter4MainQuestStep {
        return this.getState().mainQuestStep;
    }

    public hasReachedStep(step: Chapter4MainQuestStep): boolean {
        const currentIndex = CHAPTER4_MAIN_QUEST_ORDER.indexOf(this.getState().mainQuestStep);
        const targetIndex = CHAPTER4_MAIN_QUEST_ORDER.indexOf(step);

        return currentIndex !== -1 && targetIndex !== -1 && currentIndex >= targetIndex;
    }

    public markEscapedCentipedes(): void {
        const state = this.getState();
        if (state.mainQuestStep === Chapter4MainQuestStep.ESCAPE_DESERT_CENTIPEDES) {
            state.mainQuestStep = Chapter4MainQuestStep.CROSS_DESERT_PATH;
            this.syncWorldState();
        }
    }

    public markCrossedDesertPath(): void {
        const state = this.getState();
        if (state.mainQuestStep === Chapter4MainQuestStep.CROSS_DESERT_PATH) {
            state.mainQuestStep = Chapter4MainQuestStep.REACH_DESERT_POND;
            this.syncWorldState();
        }
    }

    public markJumpedIntoEmeraldPond(): void {
        const state = this.getState();
        if (!this.hasReachedStep(Chapter4MainQuestStep.JUMP_INTO_EMERALD_POND)) {
            state.mainQuestStep = Chapter4MainQuestStep.JUMP_INTO_EMERALD_POND;
            this.syncWorldState();
        }
    }

    public canShowEmeraldPondFish(): boolean {
        return this.hasReachedStep(Chapter4MainQuestStep.FISH_APPEARS);
    }

    public markFishAppeared(): void {
        const state = this.getState();
        if (state.mainQuestStep === Chapter4MainQuestStep.JUMP_INTO_EMERALD_POND) {
            state.mainQuestStep = Chapter4MainQuestStep.FISH_APPEARS;
            this.syncWorldState();
        }
    }

    public markEnteredUndergroundCave(): void {
        const state = this.getState();
        if (!this.hasReachedStep(Chapter4MainQuestStep.UNDERGROUND_CAVE)) {
            state.mainQuestStep = Chapter4MainQuestStep.UNDERGROUND_CAVE;
            this.syncWorldState();
        }
    }

    private getState(): Chapter4StoryState {
        const state = this.getStoryState().chapter4;

        if (!state) {
            throw new Error("Chapter 4 story state has not been initialized yet.");
        }

        return state;
    }
}
