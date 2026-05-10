import {
    CHAPTER3_MAIN_QUEST_ORDER,
    Chapter3MainQuestStep,
    Chapter3StoryState,
    StoryState
} from "../StoryState";

type GetStoryState = () => StoryState;
type SyncWorldState = () => void;

export default class Chapter3StoryManager {
    public constructor(
        private readonly getStoryState: GetStoryState,
        private readonly syncWorldState: SyncWorldState
    ) {}

    public getMainQuestStep(): Chapter3MainQuestStep {
        return this.getState().mainQuestStep;
    }

    private getState(): Chapter3StoryState {
        const state = this.getStoryState().chapter3;

        if (!state) {
            throw new Error("Chapter 3 story state has not been initialized yet.");
        }

        return state;
    }

    public hasReachedStep(step: Chapter3MainQuestStep): boolean {
        const currentIndex = CHAPTER3_MAIN_QUEST_ORDER.indexOf(this.getState().mainQuestStep);
        const targetIndex = CHAPTER3_MAIN_QUEST_ORDER.indexOf(step);

        return currentIndex !== -1 && targetIndex !== -1 && currentIndex >= targetIndex;
    }

    public isPlayerFainted(): boolean {
        const step = this.getState().mainQuestStep;
    
        return step === Chapter3MainQuestStep.FAINTED
            || step === Chapter3MainQuestStep.ATTRACT_TOOTH_FAIRY;
    }
    
    public markToothFairyAttracted(): void {
        const state = this.getState();
    
        if (state.mainQuestStep === Chapter3MainQuestStep.FAINTED) {
            state.mainQuestStep = Chapter3MainQuestStep.ATTRACT_TOOTH_FAIRY;
            this.syncWorldState();
        }
    }
    
    public markHealedByToothFairy(): void {
        const state = this.getState();
    
        if (state.mainQuestStep === Chapter3MainQuestStep.ATTRACT_TOOTH_FAIRY) {
            state.mainQuestStep = Chapter3MainQuestStep.HEALED_BY_TOOTH_FAIRY;
            this.syncWorldState();
        }
    }
    
    public markNeedExcalibur(): void {
        const state = this.getState();
    
        if (state.mainQuestStep === Chapter3MainQuestStep.HEALED_BY_TOOTH_FAIRY) {
            state.mainQuestStep = Chapter3MainQuestStep.NEED_EXCALIBUR;
            this.syncWorldState();
        }
    }
    
    
    public markExcaliburPulled(): void {
        const state = this.getState();

        if (
            state.mainQuestStep === Chapter3MainQuestStep.HEALED_BY_TOOTH_FAIRY
            || state.mainQuestStep === Chapter3MainQuestStep.NEED_EXCALIBUR
        ) {
            state.mainQuestStep = Chapter3MainQuestStep.EXCALIBUR_PULLED;
            this.syncWorldState();
        }
    }

    public canTriggerVineExitClose(): boolean {
        return this.getState().mainQuestStep === Chapter3MainQuestStep.EXCALIBUR_PULLED;
    }

    public markVineExitClosed(): void {
        const state = this.getState();

        if (state.mainQuestStep === Chapter3MainQuestStep.EXCALIBUR_PULLED) {
            state.mainQuestStep = Chapter3MainQuestStep.VINE_EXIT_CLOSED;
            this.syncWorldState();
        }
    }

    public isVineExitClosed(): boolean {
        return this.getState().mainQuestStep === Chapter3MainQuestStep.VINE_EXIT_CLOSED;
    }

    public markVineExitOpened(): void {
        const state = this.getState();

        if (state.mainQuestStep === Chapter3MainQuestStep.VINE_EXIT_CLOSED) {
            state.mainQuestStep = Chapter3MainQuestStep.VINE_EXIT_OPEN;
            this.syncWorldState();
        }
    }
}
