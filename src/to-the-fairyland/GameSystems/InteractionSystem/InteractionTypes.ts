/**
 * Shared interaction types and small builder helpers.
 * This file stays dependency-light so object and NPC interaction modules can both
 * import from it without creating circular references.
 */
export type InteractionType = "dialogue";
export type InteractionData = DialogueInteraction;

// These actions fire after a non-branching dialogue has fully finished.
export const DialogueCompleteActions = {
    GOTO_CHAPTER2: "gotoChapter2",
    GIVE_FLOWER_RING: "giveFlowerRing"
} as const;

export type DialogueCompleteAction =
    typeof DialogueCompleteActions[keyof typeof DialogueCompleteActions];

// These actions fire when the player explicitly picks a dialogue option.
export const DialogueChoiceActions = {
    COLLECT_FROZEN_BERRIES: "collectFrozenBerries",
    COOK_FROZEN_BERRIES: "cookFrozenBerries",
    TAKE_FRESH_PRETTY_TOOTH: "takeFreshPrettyTooth",
    SLEEP: "sleep",
    PICKUP_MAP: "pickupMap"
} as const;

export type DialogueChoiceAction =
    typeof DialogueChoiceActions[keyof typeof DialogueChoiceActions];

export interface DialogueChoiceOption {
    label: string;
    interaction: DialogueInteraction;
    choiceAction?: DialogueChoiceAction;
    onSelect?: () => void;
}

export interface DialogueChoicePrompt {
    lineIndex: number;
    options: DialogueChoiceOption[];
}

// Every interaction in the current system is dialogue, so they all share these fields.
interface DialogueInteractionBase {
    type: "dialogue";
    lines: string[];
}

// Choice-based interactions branch into a new interaction and do not directly complete.
export interface DialogueInteractionWithChoice extends DialogueInteractionBase {
    choice: DialogueChoicePrompt;
    completeAction?: never;
    onComplete?: never;
}

// Non-choice interactions may run side effects once the final line has been read.
export interface DialogueInteractionWithoutChoice extends DialogueInteractionBase {
    choice?: never;
    completeAction?: DialogueCompleteAction;
    onComplete?: () => void;
}

export type DialogueInteraction =
    | DialogueInteractionWithChoice
    | DialogueInteractionWithoutChoice;

// Convenience builder for the common "just show these lines" case.
export const dialogue = (
    lines: string[],
    extra?: Omit<DialogueInteractionWithoutChoice, "type" | "lines">
): DialogueInteractionWithoutChoice => ({
    type: "dialogue",
    lines,
    ...extra
});

// Convenience builder for interactions that pause on a choice prompt.
export const dialogueWithChoice = (
    lines: string[],
    choice: DialogueChoicePrompt
): DialogueInteractionWithChoice => ({
    type: "dialogue",
    lines,
    choice
});

// Convenience builder so choice tables stay compact and readable.
export const choiceOption = (
    label: string,
    interaction: DialogueInteraction,
    extra?: Omit<DialogueChoiceOption, "label" | "interaction">
): DialogueChoiceOption => ({
    label,
    interaction,
    ...extra
});
