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

    public isPlayerFainted(): boolean {
        const step = this.getState().mainQuestStep;
    
        return step === Chapter4MainQuestStep.FAINTED
            || step === Chapter4MainQuestStep.ATTRACT_TOOTH_FAIRY;
    }
    
    public markToothFairyAttracted(): void {
        const state = this.getState();
    
        if (state.mainQuestStep === Chapter4MainQuestStep.FAINTED) {
            state.mainQuestStep = Chapter4MainQuestStep.ATTRACT_TOOTH_FAIRY;
            this.syncWorldState();
        }
    }
    
    public markHealedByToothFairy(): void {
        const state = this.getState();
    
        if (state.mainQuestStep === Chapter4MainQuestStep.ATTRACT_TOOTH_FAIRY) {
            state.mainQuestStep = Chapter4MainQuestStep.HEALED_BY_TOOTH_FAIRY;
            this.syncWorldState();
        }
    }
    
    public markNeedExcalibur(): void {
        const state = this.getState();
    
        if (state.mainQuestStep === Chapter4MainQuestStep.HEALED_BY_TOOTH_FAIRY) {
            state.mainQuestStep = Chapter4MainQuestStep.NEED_EXCALIBUR;
            this.syncWorldState();
        }
    }
    
    
    public markExcaliburPulled(): void {
        const state = this.getState();

        if (state.mainQuestStep === Chapter4MainQuestStep.NEED_EXCALIBUR) {
            state.mainQuestStep = Chapter4MainQuestStep.EXCALIBUR_PULLED;
            this.syncWorldState();
        }
    }

    public canTriggerVineExitClose(): boolean {
        return this.getState().mainQuestStep === Chapter4MainQuestStep.EXCALIBUR_PULLED;
    }

    public markVineExitClosed(): void {
        const state = this.getState();

        if (state.mainQuestStep === Chapter4MainQuestStep.EXCALIBUR_PULLED) {
            state.mainQuestStep = Chapter4MainQuestStep.VINE_EXIT_CLOSED;
            this.syncWorldState();
        }
    }

    public isVineExitClosed(): boolean {
        return this.getState().mainQuestStep === Chapter4MainQuestStep.VINE_EXIT_CLOSED;
    }

    public markVineExitOpened(): void {
        const state = this.getState();

        if (state.mainQuestStep === Chapter4MainQuestStep.VINE_EXIT_CLOSED) {
            state.mainQuestStep = Chapter4MainQuestStep.VINE_EXIT_OPEN;
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
