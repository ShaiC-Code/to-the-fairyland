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
    
    private advanceIfVillageItemsComplete(): void {
        const state = this.getState();
    
        if (
            state.mainQuestStep === Chapter2MainQuestStep.COLLECT_VILLAGE_ITEMS &&
            REQUIRED_VILLAGE_ITEMS.every(item => state.villageItems[item])
        ) {
            state.mainQuestStep = Chapter2MainQuestStep.LEAVE_VILLAGE;
        }
    }
    
    public canLeaveVillage(): boolean {
        return this.hasReachedStep(Chapter2MainQuestStep.LEAVE_VILLAGE);
    } 

    public markLeaveVillage(): void {
        this.advanceToStep(Chapter2MainQuestStep.SLEEP_ON_ROAD);
    }    
    
    public canSleepOnRoad(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.SLEEP_ON_ROAD;
    }
    
    public markSleepOnRoad(): void {
        this.advanceToStep(Chapter2MainQuestStep.APPROACH_CLIFF);
    }
    
    public needsToApproachCliff(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.APPROACH_CLIFF;
    }
    
    public markApproachCliff(): void {
        this.advanceToStep(Chapter2MainQuestStep.VILLAGE_SHAKE);
    }
    
    public markVillageShake(): void {
        this.advanceToStep(Chapter2MainQuestStep.CHECK_VILLAGE);
    }
    
    public needsToCheckVillage(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.CHECK_VILLAGE;
    }
    
    public hasReachedCheckVillage(): boolean {
        return this.hasReachedStep(Chapter2MainQuestStep.CHECK_VILLAGE);
    }

    public markCheckVillage(): void {
        this.advanceToStep(Chapter2MainQuestStep.RETURNED_TO_VILLAGE);
    }

    public hasReturnedToVillage(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.RETURNED_TO_VILLAGE;
    }
    
    public markReturnedToVillage(): void {
        this.advanceToStep(Chapter2MainQuestStep.DETECTED_BY_LYCANS);
    }
    
    public needsLycanDetection(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.RETURNED_TO_VILLAGE;
    }
    
    public wasDetectedByLycans(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.DETECTED_BY_LYCANS;
    }
    
    public markDetectedByLycans(): void {
        this.advanceToStep(Chapter2MainQuestStep.ESCAPE_LYCANS);
    }
    
    public needsToEscapeLycans(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.ESCAPE_LYCANS;
    }

    public markEscapeLycans(): void {
        this.advanceToStep(Chapter2MainQuestStep.CLIFF_JUMP);
    }

    public needsToJumpOffCliff(): boolean {
        return this.getState().mainQuestStep === Chapter2MainQuestStep.CLIFF_JUMP;
    }
}
