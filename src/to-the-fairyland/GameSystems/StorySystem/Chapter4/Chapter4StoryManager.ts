import { Chapter4MainQuestStep, Chapter4StoryState, StoryState } from "../StoryState";

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
