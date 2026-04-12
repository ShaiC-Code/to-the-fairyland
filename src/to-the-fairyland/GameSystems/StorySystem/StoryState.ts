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

export interface StoryState {
    chapter1: Chapter1StoryState;
}


export function createInitialStoryState(): StoryState {
    return {
        chapter1: {
            mainQuestStep: Chapter1MainQuestStep.NEED_FOOD,
        }
    };
}