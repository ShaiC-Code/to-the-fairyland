import { Chapter1MainQuestStep } from "../StorySystem/StoryState";

export type InteractionType = "dialogue";
export type InteractionData = DialogueInteraction;

export type DialogueChoiceAction = "collectFrozenBerries" | "sleep" | "pickupMap";

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
    },

    MapItem: {
        type: "dialogue",
        lines: [
            "A blood-stained map rests in the snow.",
            "It must have belonged to one of the fallen expedition members.",
            "Three monster kingdoms are drawn across the worn map.",
            "Beyond them, a distant land is marked in trembling ink: 'The FairyLand.'",
            "A message sits beside it.",
            "'Humanity's last hope.'",
            "Pick up map?"
        ],
        choice: {
            lineIndex: 6,
            options: [
                {
                    label: "Yes",
                    action: "pickupMap",
                    interaction: {
                        type: "dialogue",
                        lines: [
                            "You take the map.",
                            "Whatever happened here, their final hope now rests with you."
                        ]
                    }
                },
                {
                    label: "No",
                    interaction: {
                        type: "dialogue",
                        lines: [
                            "You hesitate and leave the map untouched.",
                            "The frozen wind rustles its edges."
                        ]
                    }
                }
            ]
        }
    }
    
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
            return {
                type: "dialogue",
                lines: [
                    "This bed looks warm and surprisingly comfortable.",
                    "Hunger is preventing you from sleeping..."
                ]
            };

        case Chapter1MainQuestStep.RETURN_TO_BED:
            return {
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
                            action: "sleep",
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
            };

        default:
            return {
                type: "dialogue",
                lines: [
                    "You already got some rest."
                ]
            };
    }

}