import { Chapter1MainQuestStep } from "../StorySystem/StoryState";

export type InteractionType = "dialogue";

export interface DialogueChoiceOption {
    label: string;
    interaction: DialogueInteraction;
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

export type InteractionData = DialogueInteraction;

const STATIC_INTERACTIONS: Readonly<Record<string, InteractionData>> = {
    BushBerries: {
        type: "dialogue",
        lines: [
            "A bush covered in red berries pokes through the snow.",
            "Most of the berries are frozen solid."
        ]
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
            "Take a rest?",
            "Ready to sleep?"
        ],
        choice: {
            lineIndex: 2,
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