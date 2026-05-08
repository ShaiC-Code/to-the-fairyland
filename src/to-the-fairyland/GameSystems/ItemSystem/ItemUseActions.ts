export const ItemUseActions = {
    SLEEP_WITH_SLEEPING_BAG: "sleepWithSleepingBag",
    HOLD_UP_TOOTH: "holdUpTooth"
} as const;

export type ItemUseAction =
    typeof ItemUseActions[keyof typeof ItemUseActions];

export interface ItemUseResult {
    success: boolean;
    lines: string[];
}

