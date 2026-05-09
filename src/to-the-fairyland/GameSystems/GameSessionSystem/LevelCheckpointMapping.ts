import {
    ActiveChapter,
    CHAPTER1_MAIN_QUEST_ORDER,
    CHAPTER2_MAIN_QUEST_ORDER,
    CHAPTER3_MAIN_QUEST_ORDER,
    CHAPTER4_MAIN_QUEST_ORDER,
    Chapter1MainQuestStep,
    Chapter2MainQuestStep,
    Chapter3MainQuestStep,
    Chapter4MainQuestStep,
    StoryState
} from "../StorySystem/StoryState";

export type CheckpointStoryKey = `${ActiveChapter}:${string}`;
export type LevelSelectionId = `level${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;

export function buildCheckpointStoryKey(chapter: ActiveChapter, questStep: string): CheckpointStoryKey {
    return `${chapter}:${questStep}`;
}

function getStoryStep(storyState: StoryState): string | undefined {
    switch (storyState.activeChapter) {
        case ActiveChapter.CHAPTER1:
            return storyState.chapter1.mainQuestStep;
        case ActiveChapter.CHAPTER2:
            return storyState.chapter2?.mainQuestStep;
        case ActiveChapter.CHAPTER3:
            return storyState.chapter3?.mainQuestStep;
        case ActiveChapter.CHAPTER4:
            return storyState.chapter4?.mainQuestStep;
        default:
            return undefined;
    }
}

/** Returns the active chapter's current quest step as a string. */
export function getCurrentStoryStep(storyState: StoryState): string | undefined {
    return getStoryStep(storyState);
}

export function isCheckpointStoryKey(key: CheckpointStoryKey): boolean {
    return CHECKPOINT_STORY_KEYS.has(key);
}

/**
 * Returns the ordering index for a story step within its chapter quest order.
 * -1 means the step is not in the order list (unknown / not ordered).
 */
export function getStoryStepOrderIndex(chapter: ActiveChapter, step: string): number {
    switch (chapter) {
        case ActiveChapter.CHAPTER1:
            return CHAPTER1_MAIN_QUEST_ORDER.indexOf(step as Chapter1MainQuestStep);
        case ActiveChapter.CHAPTER2:
            return CHAPTER2_MAIN_QUEST_ORDER.indexOf(step as Chapter2MainQuestStep);
        case ActiveChapter.CHAPTER3:
            return CHAPTER3_MAIN_QUEST_ORDER.indexOf(step as Chapter3MainQuestStep);
        case ActiveChapter.CHAPTER4:
            return CHAPTER4_MAIN_QUEST_ORDER.indexOf(step as Chapter4MainQuestStep);
        default:
            return -1;
    }
}

export const LEVEL_TO_CHECKPOINT_STORY_KEY: Readonly<Record<LevelSelectionId, CheckpointStoryKey>> = {
    level1: buildCheckpointStoryKey(ActiveChapter.CHAPTER1, Chapter1MainQuestStep.NEED_FOOD),
    level2: buildCheckpointStoryKey(ActiveChapter.CHAPTER2, Chapter2MainQuestStep.COLLECT_VILLAGE_ITEMS),
    level3: buildCheckpointStoryKey(ActiveChapter.CHAPTER2, Chapter2MainQuestStep.LEAVE_VILLAGE),
    level4: buildCheckpointStoryKey(ActiveChapter.CHAPTER2, Chapter2MainQuestStep.RETURNED_TO_VILLAGE),
    level5: buildCheckpointStoryKey(ActiveChapter.CHAPTER2, Chapter2MainQuestStep.CLIFF_JUMP),
    level6: buildCheckpointStoryKey(ActiveChapter.CHAPTER3, Chapter3MainQuestStep.FAINTED),
    level7: buildCheckpointStoryKey(ActiveChapter.CHAPTER3, Chapter3MainQuestStep.NEED_EXCALIBUR),
    level8: buildCheckpointStoryKey(ActiveChapter.CHAPTER3, Chapter3MainQuestStep.VINE_EXIT_OPEN),
    level9: buildCheckpointStoryKey(ActiveChapter.CHAPTER4, Chapter4MainQuestStep.ESCAPE_DESERT_CENTIPEDES),
    level10: buildCheckpointStoryKey(ActiveChapter.CHAPTER4, Chapter4MainQuestStep.JUMP_INTO_EMERALD_POND)
};

function getLevelSelectionNumber(levelId: LevelSelectionId): number {
    const asNumber = Number(levelId.replace("level", ""));
    return Number.isFinite(asNumber) ? asNumber : 0;
}

/**
 * Stable ordered list of level IDs.
 * Avoid relying on object key iteration ordering.
 */
export const ORDERED_LEVEL_SELECTION_IDS: ReadonlyArray<LevelSelectionId> =
    (Object.keys(LEVEL_TO_CHECKPOINT_STORY_KEY) as LevelSelectionId[])
        .slice()
        .sort((a, b) => getLevelSelectionNumber(a) - getLevelSelectionNumber(b));

const CHECKPOINT_KEY_TO_LEVEL_ID = new Map<CheckpointStoryKey, LevelSelectionId>(
    ORDERED_LEVEL_SELECTION_IDS.map(levelId => [LEVEL_TO_CHECKPOINT_STORY_KEY[levelId], levelId])
);

export function getLevelSelectionIdForCheckpointKey(checkpointKey: CheckpointStoryKey): LevelSelectionId | undefined {
    return CHECKPOINT_KEY_TO_LEVEL_ID.get(checkpointKey);
}

export function isLevelSelectionId(value: unknown): value is LevelSelectionId {
    return typeof value === "string"
        && (ORDERED_LEVEL_SELECTION_IDS as ReadonlyArray<string>).includes(value);
}

const CHECKPOINT_STORY_KEYS = new Set<CheckpointStoryKey>(Object.values(LEVEL_TO_CHECKPOINT_STORY_KEY));

export function resolveCheckpointStoryKey(storyState: StoryState): CheckpointStoryKey | undefined {
    const currentStep = getStoryStep(storyState);
    if (!currentStep) {
        return undefined;
    }

    const key = buildCheckpointStoryKey(storyState.activeChapter, currentStep);
    return CHECKPOINT_STORY_KEYS.has(key) ? key : undefined;
}
