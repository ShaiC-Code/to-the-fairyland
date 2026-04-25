import {
    CHAPTER2_MAIN_QUEST_ORDER,
    Chapter2MainQuestStep,
    Chapter2StoryState,
    Chapter2VillageItem,
    StoryState
} from "../StoryState";


type GetStoryState = () => StoryState;
type SyncWorldState = () => void;

const REQUIRED_VILLAGE_ITEMS = [
    Chapter2VillageItem.FRESH_PRETTY_TOOTH,
    Chapter2VillageItem.FLOWER_RING,
    Chapter2VillageItem.LOFTY_BREAD,
    Chapter2VillageItem.SLEEPING_BAG,
    Chapter2VillageItem.OBSIDIAN_BOOTS
] as const;


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

    public markVillageItemReceived(item: Chapter2VillageItem): void {
        const state = this.getState();
    
        if (state.villageItems[item]) {
            return;
        }
    
        state.villageItems[item] = true;
        this.advanceIfVillageItemsComplete();
    }

    public hasVillageItem(item: Chapter2VillageItem): boolean {
        return this.getState().villageItems[item];
    }
    
    public canLeaveVillage(): boolean {
        return this.hasReachedStep(Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE);
    }    
    
    private advanceIfVillageItemsComplete(): void {
        const state = this.getState();
    
        if (
            state.mainQuestStep === Chapter2MainQuestStep.COLLECT_VILLAGE_ITEMS &&
            REQUIRED_VILLAGE_ITEMS.every(item => state.villageItems[item])
        ) {
            state.mainQuestStep = Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE;
        }
    }

    public markArrivedAtRoad3(): void {
        this.advanceToStep(Chapter2MainQuestStep.NEED_TO_SLEEP_ON_ROAD);
    }    
    
    public canSleepOnRoad(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.NEED_TO_SLEEP_ON_ROAD;
    }
    
    public markSleptOnRoad(): void {
        this.advanceToStep(Chapter2MainQuestStep.NEED_TO_APPROACH_CLIFF);
    }
    
    public needsToApproachCliff(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.NEED_TO_APPROACH_CLIFF;
    }
    
    public markVillageShakeStarted(): void {
        this.advanceToStep(Chapter2MainQuestStep.VILLAGE_SHAKE);
    }
    
    public markVillageShakeComplete(): void {
        this.advanceToStep(Chapter2MainQuestStep.CHECK_VILLAGE);
    }
    
    public needsToCheckVillage(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.CHECK_VILLAGE;
    }
    

    private hasReachedStep(step: Chapter2MainQuestStep): boolean {
        const currentIndex = CHAPTER2_MAIN_QUEST_ORDER.indexOf(this.getState().mainQuestStep);
        const targetIndex = CHAPTER2_MAIN_QUEST_ORDER.indexOf(step);
    
        return currentIndex !== -1 && targetIndex !== -1 && currentIndex >= targetIndex;
    }

    private advanceToStep(step: Chapter2MainQuestStep): void {
        if (this.hasReachedStep(step)) {
            return;
        }
    
        this.getState().mainQuestStep = step;
    }
    
    
}
