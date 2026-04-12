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
    charsPerSecond?: number;
    choice?: DialogueChoicePrompt;
}

export type InteractionData = DialogueInteraction;

const INTERACTION_DATABASE: Readonly<Record<string, InteractionData>> = {
    Bed: {
        type: "dialogue",
        lines: [
            "A simple bed stands against the wall.",
            "It looks warm and surprisingly comfortable.",
            "Take a rest?"
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

    BushBerries: {
        type: "dialogue",
        lines: [
            "A bush covered in blue berries pokes through the snow.",
            "Most of the berries are frozen solid."
        ]
    }
};

export function getInteractionData(interactionId: string): InteractionData | undefined {
    return INTERACTION_DATABASE[interactionId];
}

export function hasInteractionData(interactionId: string): boolean {
    return interactionId in INTERACTION_DATABASE;
}
