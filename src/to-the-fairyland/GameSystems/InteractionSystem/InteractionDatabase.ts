import { Chapter1MainQuestStep } from "../StorySystem/StoryState";

export type InteractionType = "dialogue";
export type InteractionData = DialogueInteraction;

export type DialogueChoiceAction = "collectFrozenBerries";

// Different choices and its associated action if any
export interface DialogueChoiceOption {
    label: string;
    interaction: DialogueInteraction;
    action?: DialogueChoiceAction;
}

export interface DialogueChoicePrompt {
    lineIndex: number;
    options: DialogueChoiceOption[];
}

export interface DialogueInteraction {
    type: "dialogue";
    lines: string[];
    choice?: DialogueChoicePrompt;
}


const STATIC_INTERACTIONS: Readonly<Record<string, InteractionData>> = {
    BushBerries: {
        type: "dialogue",
        lines: [
            "A bush covered in blue berries pokes through the snow.",
            "Most of the berries are frozen solid.",
            "Collect berries?"
        ],
        choice: {
            lineIndex: 2,
            options: [
                {
                    label: "Yes",
                    action: "collectFrozenBerries",
                    interaction: {
                        type: "dialogue",
                        lines: ["You picked a few frozen berries."]
                    }
                },
                {
                    label: "No",
                    interaction: {
                        type: "dialogue",
                        lines: ["You left the bush alone."]
                    }
                }
            ]
        }
    }
};

const BED_DIALOGUES: Readonly<Record<Chapter1MainQuestStep, DialogueInteraction>> = {
    [Chapter1MainQuestStep.NEED_FOOD]: {
        type: "dialogue",
        lines: [
            "This bed looks warm and surprisingly comfortable.",
            "Hunger is preventing you from sleeping..."
        ]
    },
    [Chapter1MainQuestStep.RETURN_TO_BED]: {
        type: "dialogue",
        lines: [
            "This bed looks warm and surprisingly comfortable.",
            "Take a rest?"
        ],
        choice: {
            lineIndex: 1,
            options: [
                {
                    label: "Yes",
                    interaction: {
                        type: "dialogue",
                        lines: ["You rest."]
                    }
                },
                {
                    label: "No",
                    interaction: {
                        type: "dialogue",
                        lines: ["Not Yet."]
                    }
                }
            ]
        }
    },
    [Chapter1MainQuestStep.SLEPT]: {
        type: "dialogue",
        lines: [
            "You already got some rest."
        ]
    }
};

export function getInteractionData(interactionId: string): InteractionData | undefined {
    return STATIC_INTERACTIONS[interactionId];
}

export function getBedDialogue(step: Chapter1MainQuestStep): DialogueInteraction {
    return BED_DIALOGUES[step];
}