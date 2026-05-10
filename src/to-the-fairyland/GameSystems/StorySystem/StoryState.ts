export enum ActiveChapter {
    CHAPTER1 = "CHAPTER1",
    CHAPTER2 = "CHAPTER2",
    CHAPTER3 = "CHAPTER3",
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

export const CHAPTER1_MAIN_QUEST_ORDER = Object.values(Chapter1MainQuestStep);

export interface Chapter1StoryState {
    mainQuestStep: Chapter1MainQuestStep;
}

//======================== Chapter2 =================================
export enum Chapter2MainQuestStep {
    COLLECT_VILLAGE_ITEMS = "COLLECT_VILLAGE_ITEMS",
    LEAVE_VILLAGE = "LEAVE_VILLAGE",
    SLEEP_ON_ROAD = "SLEEP_ON_ROAD",
    APPROACH_CLIFF = "APPROACH_CLIFF",
    CHECK_VILLAGE = "CHECK_VILLAGE",
    RETURNED_TO_VILLAGE = "RETURNED_TO_VILLAGE",
    ESCAPE_LYCANS = "ESCAPE_LYCANS",
    CLIFF_JUMP = "CLIFF_JUMP"
}

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

//======================== Chapter3 =================================
export enum Chapter3MainQuestStep {
    FAINTED = "FAINTED",
    ATTRACT_TOOTH_FAIRY = "ATTRACT_TOOTH_FAIRY",
    HEALED_BY_TOOTH_FAIRY = "HEALED_BY_TOOTH_FAIRY",
    NEED_EXCALIBUR = "NEED_EXCALIBUR",
    EXCALIBUR_PULLED = "EXCALIBUR_PULLED",
    VINE_EXIT_CLOSED = "VINE_EXIT_CLOSED",
    VINE_EXIT_OPEN = "VINE_EXIT_OPEN"
}

export const CHAPTER3_MAIN_QUEST_ORDER = Object.values(Chapter3MainQuestStep);

export interface Chapter3StoryState {
    mainQuestStep: Chapter3MainQuestStep;
}

//======================== Chapter4 =================================
export enum Chapter4MainQuestStep {
    ESCAPE_DESERT_CENTIPEDES = "ESCAPE_DESERT_CENTIPEDES",
    CROSS_DESERT_PATH = "CROSS_DESERT_PATH",
    REACH_DESERT_POND = "REACH_DESERT_POND",
    JUMP_INTO_EMERALD_POND = "JUMP_INTO_EMERALD_POND"
}

export const CHAPTER4_MAIN_QUEST_ORDER = Object.values(Chapter4MainQuestStep);

export interface Chapter4StoryState {
    mainQuestStep: Chapter4MainQuestStep;
}

// =================================================================

export interface StoryState {
    activeChapter: ActiveChapter;
    chapter1: Chapter1StoryState;
    chapter2?: Chapter2StoryState;
    chapter3?: Chapter3StoryState;
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
export function createChapter2CompletedState(): Chapter2StoryState {
    return {
        mainQuestStep: Chapter2MainQuestStep.ESCAPE_LYCANS,
        villageItems: {
            [Chapter2VillageItem.FRESH_PRETTY_TOOTH]: true,
            [Chapter2VillageItem.FLOWER_RING]: true,
            [Chapter2VillageItem.LOFTY_BREAD]: true,
            [Chapter2VillageItem.SLEEPING_BAG]: true,
            [Chapter2VillageItem.OBSIDIAN_BOOTS]: true
        }
    };
}
export function createInitialChapter4State(): Chapter4StoryState {
    return {
        mainQuestStep: Chapter4MainQuestStep.ESCAPE_DESERT_CENTIPEDES
    };
}


export function createInitialChapter3State(): Chapter3StoryState {
    return {
        mainQuestStep: Chapter3MainQuestStep.FAINTED
    };
}


