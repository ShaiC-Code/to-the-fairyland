import { CookieStorage } from "./CookieStorage";
import {
    CheckpointStoryKey,
    getLevelSelectionIdForCheckpointKey,
    isLevelSelectionId,
    LevelSelectionId,
    ORDERED_LEVEL_SELECTION_IDS
} from "./LevelCheckpointMapping";

const UNLOCKED_LEVELS_COOKIE_KEY = "unlockedLevels";

function loadUnlockedLevelPrefixFromCookie(): LevelSelectionId[] {
    const stored = CookieStorage.getItem(UNLOCKED_LEVELS_COOKIE_KEY);

    if (!stored || !Array.isArray(stored)) {
        return [];
    }

    const storedIds: LevelSelectionId[] = [];
    for (const value of stored) {
        if (isLevelSelectionId(value)) {
            storedIds.push(value);
        }
    }

    let maxIndex = -1;
    for (const levelId of storedIds) {
        const idx = ORDERED_LEVEL_SELECTION_IDS.indexOf(levelId);
        if (idx > maxIndex) {
            maxIndex = idx;
        }
    }

    if (maxIndex < 0) {
        return [];
    }

    return ORDERED_LEVEL_SELECTION_IDS.slice(0, maxIndex + 1);
}

export function loadUnlockedLevelsFromCookie(): Set<LevelSelectionId> {
    return new Set(loadUnlockedLevelPrefixFromCookie());
}

export function getMaxUnlockedLevelIndexFromCookie(): number {
    return loadUnlockedLevelPrefixFromCookie().length - 1;
}

export function unlockThroughLevel(levelId: LevelSelectionId): Set<LevelSelectionId> {
    const targetIndex = ORDERED_LEVEL_SELECTION_IDS.indexOf(levelId);
    if (targetIndex < 0) {
        return loadUnlockedLevelsFromCookie();
    }

    const currentPrefix = loadUnlockedLevelPrefixFromCookie();
    const currentMaxIndex = currentPrefix.length - 1;

    if (targetIndex <= currentMaxIndex) {
        return new Set(currentPrefix);
    }

    const newPrefix = ORDERED_LEVEL_SELECTION_IDS.slice(0, targetIndex + 1);
    CookieStorage.setItem(UNLOCKED_LEVELS_COOKIE_KEY, newPrefix);
    return new Set(newPrefix);
}

export function unlockForCheckpointKey(checkpointKey: CheckpointStoryKey): Set<LevelSelectionId> | null {
    const levelId = getLevelSelectionIdForCheckpointKey(checkpointKey);
    if (!levelId) {
        return null;
    }

    return unlockThroughLevel(levelId);
}

export function unlockAllLevels(): Set<LevelSelectionId> {
    CookieStorage.setItem(UNLOCKED_LEVELS_COOKIE_KEY, ORDERED_LEVEL_SELECTION_IDS);
    return new Set(ORDERED_LEVEL_SELECTION_IDS);
}

export function clearUnlockedLevels(): void {
    CookieStorage.removeItem(UNLOCKED_LEVELS_COOKIE_KEY);
}
