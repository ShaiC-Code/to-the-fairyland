export enum ActiveChapter {
    CHAPTER1 = "CHAPTER1",
    CHAPTER2 = "CHAPTER2",
    CHAPTER4 = "CHAPTER4"
}

//======================== Chapter1 =================================
export enum Chapter1MainQuestStep {
    NEED_FOOD = "NEED_FOOD",
    NEED_TO_COOK = "NEED_TO_COOK",
    NEED_TO_EAT = "NEED_TO_EAT",
    RETURN_TO_BED = "RETURN_TO_BED",
    SLEPT = "SLEPT",
    MAP_PICKED = "MAP_PICKED"
}

export interface Chapter1StoryState {
    mainQuestStep: Chapter1MainQuestStep;
}

//======================== Chapter2 =================================
export const Chapter2MainQuestStep = {
    COLLECT_VILLAGE_ITEMS: "COLLECT_VILLAGE_ITEMS",
    READY_TO_LEAVE_VILLAGE: "READY_TO_LEAVE_VILLAGE",
    NEED_TO_SLEEP_ON_ROAD: "NEED_TO_SLEEP_ON_ROAD",
    NEED_TO_APPROACH_CLIFF: "NEED_TO_APPROACH_CLIFF",
    VILLAGE_SHAKE: "VILLAGE_SHAKE",
    CHECK_VILLAGE: "CHECK_VILLAGE",
    DETECTED_BY_LYCANS: "DETECTED_BY_LYCANS",
    ESCAPE_LYCANS: "ESCAPE_LYCANS"
} as const;

export type Chapter2MainQuestStep =
    typeof Chapter2MainQuestStep[keyof typeof Chapter2MainQuestStep];

export const CHAPTER2_MAIN_QUEST_ORDER = Object.values(Chapter2MainQuestStep);

export enum Chapter2VillageItem {
    FRESH_PRETTY_TOOTH = "FRESH_PRETTY_TOOTH",
    FLOWER_RING = "FLOWER_RING",
    LOFTY_BREAD = "LOFTY_BREAD",
    SLEEPING_BAG = "SLEEPING_BAG",
    OBSIDIAN_BOOTS = "OBSIDIAN_BOOTS"
}

export interface Chapter2StoryState {
    mainQuestStep: Chapter2MainQuestStep;
    villageItems: Record<Chapter2VillageItem, boolean>;
}
//======================== Chapter4 =================================
export enum Chapter4MainQuestStep {
    NEED_EXCALIBUR = "NEED_EXCALIBUR",
    EXCALIBUR_PULLED = "EXCALIBUR_PULLED",
    VINE_EXIT_CLOSED = "VINE_EXIT_CLOSED",
    VINE_EXIT_OPEN = "VINE_EXIT_OPEN"
}
export interface Chapter4StoryState {
    mainQuestStep: Chapter4MainQuestStep;
}
// =================================================================

export interface StoryState {
    activeChapter: ActiveChapter;
    chapter1: Chapter1StoryState;
    chapter2?: Chapter2StoryState;
    chapter4?: Chapter4StoryState;
}

export function createInitialChapter1State(): Chapter1StoryState {
    return {
        mainQuestStep: Chapter1MainQuestStep.NEED_FOOD
    };
}
export function createChapter1CompletedState(): Chapter1StoryState {
    return {
        mainQuestStep: Chapter1MainQuestStep.MAP_PICKED
    };
}

export function createInitialChapter2State(): Chapter2StoryState {
    return {
        mainQuestStep: Chapter2MainQuestStep.COLLECT_VILLAGE_ITEMS,
        villageItems: {
            [Chapter2VillageItem.FRESH_PRETTY_TOOTH]: false,
            [Chapter2VillageItem.FLOWER_RING]: false,
            [Chapter2VillageItem.LOFTY_BREAD]: false,
            [Chapter2VillageItem.SLEEPING_BAG]: false,
            [Chapter2VillageItem.OBSIDIAN_BOOTS]: false
        }
    };
}

export function createInitialChapter4State(): Chapter4StoryState {
    return {
        mainQuestStep: Chapter4MainQuestStep.NEED_EXCALIBUR
    };
}


