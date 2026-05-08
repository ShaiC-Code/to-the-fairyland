import {
    ActiveChapter,
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

const CHECKPOINT_STORY_KEYS = new Set<CheckpointStoryKey>(Object.values(LEVEL_TO_CHECKPOINT_STORY_KEY));

export function resolveCheckpointStoryKey(storyState: StoryState): CheckpointStoryKey | undefined {
    const currentStep = getStoryStep(storyState);
    if (!currentStep) {
        return undefined;
    }

    const key = buildCheckpointStoryKey(storyState.activeChapter, currentStep);
    return CHECKPOINT_STORY_KEYS.has(key) ? key : undefined;
}
