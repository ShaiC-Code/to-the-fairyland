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

    public markVilaToothReceived(): void {
        const state = this.getState();
    
        if (state.villageItems.gotVilaTooth) {
            return;
        }
    
        state.villageItems.gotVilaTooth = true;
        this.advanceIfVillageItemsComplete();
    }
    public markJItemReceived(): void {
        const state = this.getState();
    
        if (state.villageItems.gotJItem) {
            return;
        }
    
        state.villageItems.gotJItem = true;
        this.advanceIfVillageItemsComplete();
    }

    public hasVilaTooth(): boolean {
        return this.getState().villageItems.gotVilaTooth;
    }
    
    public hasJItem(): boolean {
        return this.getState().villageItems.gotJItem;
    }
    
    public canLeaveVillage(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE;
    }
    
    private advanceIfVillageItemsComplete(): void {
        const state = this.getState();
    
        if (
            state.mainQuestStep === Chapter2MainQuestStep.COLLECT_VILLAGE_ITEMS &&
            state.villageItems.gotVilaTooth &&
            state.villageItems.gotJItem
        ) {
            state.mainQuestStep = Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE;
            this.syncWorldState();
        }
    }
}