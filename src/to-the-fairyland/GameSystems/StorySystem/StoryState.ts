export enum ActiveChapter {
    CHAPTER1 = "CHAPTER1",
    CHAPTER2 = "CHAPTER2"
}

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


export enum Chapter2MainQuestStep {
    ARRIVE_AT_VILLAGE = "ARRIVE_AT_VILLAGE",
}

export interface Chapter2StoryState {
    mainQuestStep: Chapter2MainQuestStep;
}

export interface StoryState {
    activeChapter: ActiveChapter;
    chapter1: Chapter1StoryState;
    chapter2?: Chapter2StoryState;
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
        mainQuestStep: Chapter2MainQuestStep.ARRIVE_AT_VILLAGE
    };
}

