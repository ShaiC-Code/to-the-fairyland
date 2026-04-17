import { Chapter2MainQuestStep, Chapter2StoryState, StoryState } from "../StoryState";

type GetStoryState = () => StoryState;
type SyncWorldState = () => void;

export default class Chapter2StoryManager {
    public constructor(
        private readonly getStoryState: GetStoryState,
        private readonly syncWorldState: SyncWorldState
    ) {}

    public getMainQuestStep(): Chapter2MainQuestStep {
        return this.getState().mainQuestStep;
    }

    private getState(): Chapter2StoryState {
        const state = this.getStoryState().chapter2;

        if (!state) {
            throw new Error("Chapter 2 story state has not been initialized yet.");
        }

        return state;
    }
}