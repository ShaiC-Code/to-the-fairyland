import { Chapter1MainQuestStep } from "../StorySystem/StoryState";

export type InteractionType = "dialogue";
export type InteractionData = DialogueInteraction;

export const DialogueReadActions = {
    GOTO_CHAPTER2: "gotoChapter2"
} as const;

export type DialogueReadAction = typeof DialogueReadActions[keyof typeof DialogueReadActions];

export const DialogueChoiceActions = {
    COLLECT_FROZEN_BERRIES: "collectFrozenBerries",
    COOK_FROZEN_BERRIES: "cookFrozenBerries",
    SLEEP: "sleep",
    PICKUP_MAP: "pickupMap"
} as const;

export type DialogueChoiceAction = typeof DialogueChoiceActions[keyof typeof DialogueChoiceActions];

// Different choices and its associated action if any
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

interface DialogueInteractionBase {
    type: "dialogue";
    lines: string[];
}

export interface DialogueInteractionWithChoice extends DialogueInteractionBase {
    choice: DialogueChoicePrompt;
    readAction?: never;
    onRead?: never;
}

export interface DialogueInteractionWithoutChoice extends DialogueInteractionBase {
    choice?: never;
    readAction?: DialogueReadAction;
    onRead?: () => void;
}

export type DialogueInteraction = DialogueInteractionWithChoice | DialogueInteractionWithoutChoice;

export const dialogue = (
    lines: string[],
    extra?: Omit<DialogueInteractionWithoutChoice, "type" | "lines">
): DialogueInteractionWithoutChoice => ({
    type: "dialogue",
    lines,
    ...extra
});

export const dialogueWithChoice = (
    lines: string[],
    choice: DialogueChoicePrompt
): DialogueInteractionWithChoice => ({
    type: "dialogue",
    lines,
    choice
});

export const choiceOption = (
    label: string,
    interaction: DialogueInteraction,
    extra?: Omit<DialogueChoiceOption, "label" | "interaction">
): DialogueChoiceOption => ({
    label,
    interaction,
    ...extra
});

const STATIC_INTERACTIONS: Readonly<Record<string, InteractionData>> = {
    BushBerries: dialogueWithChoice(
        [
            "A bush covered in blue berries pokes through the snow.",
            "Most of the berries are frozen solid.",
            "Collect berries?"
        ],
        {
            lineIndex: 2,
            options: [
                choiceOption(
                    "Yes",
                    dialogue(["You picked a few frozen berries."]),
                    { choiceAction: DialogueChoiceActions.COLLECT_FROZEN_BERRIES }
                ),
                choiceOption(
                    "No",
                    dialogue(["You left the bush alone."])
                )
            ]
        }
    ),

    MapItem: dialogueWithChoice(
        [
            "A blood-stained map rests in the snow.",
            "It must have belonged to one of the fallen expedition members.",
            "Three monster kingdoms are drawn across the worn map.",
            "Beyond them, a distant land is marked in trembling ink: 'The FairyLand.'",
            "A message sits beside it.",
            "'Humanity's last hope.'",
            "Pick up map?"
        ],
        {
            lineIndex: 6,
            options: [
                choiceOption(
                    "Yes",
                    dialogue([
                        "You take the map.",
                        "Whatever happened here, their final hope now rests with you."
                    ]),
                    { choiceAction: DialogueChoiceActions.PICKUP_MAP }
                ),
                choiceOption(
                    "No",
                    dialogue([
                        "You hesitate and leave the map untouched.",
                        "The frozen wind rustles its edges."
                    ])
                )
            ]
        }
    )
};

/**
 * Looks up a static interaction definition by its interaction id.
 * This is used for world objects whose dialogue does change on story step.
 * @param interactionId The interaction key resolved from a Tiled object.
 * @returns The matching interaction data, or undefined if no static interaction exists for that id.
 */
export function getInteractionData(interactionId: string): InteractionData | undefined {
    return STATIC_INTERACTIONS[interactionId];
}

/**
 * Returns the bed dialogue that matches the player's current Chapter 1 main quest step.
 * @param step The current Chapter 1 main quest step.
 * @returns The dialogue interaction the bed should display for that story step.
 */
export function getBedDialogue(step: Chapter1MainQuestStep): DialogueInteraction {
    switch (step) {
    case Chapter1MainQuestStep.NEED_FOOD:
    case Chapter1MainQuestStep.NEED_TO_COOK:
    case Chapter1MainQuestStep.NEED_TO_EAT:
        return dialogue([
            "This bed looks warm and surprisingly comfortable.",
            "Hunger is preventing you from sleeping..."
        ]);

    case Chapter1MainQuestStep.RETURN_TO_BED:
        return dialogueWithChoice(
            [
                "This bed looks warm and surprisingly comfortable.",
                "Take a rest?"
            ],
            {
                lineIndex: 1,
                options: [
                    choiceOption(
                        "Yes",
                        dialogue(["You rest."]),
                        { choiceAction: DialogueChoiceActions.SLEEP }
                    ),
                    choiceOption(
                        "No",
                        dialogue(["Not Yet."])
                    )
                ]
            }
        );

    case Chapter1MainQuestStep.SLEPT:
        return dialogue(["You already got some rest."]);

    case Chapter1MainQuestStep.MAP_PICKED:
        return dialogue(
            [
                "...",
                "No time for rest."
            ],
            { readAction: DialogueReadActions.GOTO_CHAPTER2 }
        );

    default:
        return dialogue(["..."]);
    }
}

export function getPotDialogue(step: Chapter1MainQuestStep): DialogueInteraction {
    switch (step) {
    case Chapter1MainQuestStep.NEED_FOOD:
        return dialogue([
            "The lone pot sits in the corner waiting to be used.",
            "You could cook here if you had food..."
        ]);

    case Chapter1MainQuestStep.NEED_TO_COOK:
        return dialogueWithChoice(
            [
                "The lone pot sits in the corner waiting to be used.",
                "Cook Frozen Berries?"
            ],
            {
                lineIndex: 1,
                options: [
                    choiceOption(
                        "Yes",
                        dialogue(["You cook the frozen berries."]),
                        { choiceAction: DialogueChoiceActions.COOK_FROZEN_BERRIES }
                    ),
                    choiceOption(
                        "No",
                        dialogue(["..."])
                    )
                ]
            }
        );

    case Chapter1MainQuestStep.NEED_TO_EAT:
    case Chapter1MainQuestStep.RETURN_TO_BED:
        return dialogue(["The pot is still warm."]);

    case Chapter1MainQuestStep.SLEPT:
        return dialogue(["Remnants of your last meal remain."]);

    case Chapter1MainQuestStep.MAP_PICKED:
        return dialogue(["Remnants remain..."]);

    default:
        return dialogue(["..."]);
    }
}
