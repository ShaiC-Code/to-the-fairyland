export type InteractionType = "dialogue";

export interface DialogueInteraction {
    type: "dialogue";
    lines: string[];
    charsPerSecond?: number;
}

export type InteractionData = DialogueInteraction;

const INTERACTION_DATABASE: Readonly<Record<string, InteractionData>> = {
    Bed: {
        type: "dialogue",
        lines: [
            "A simple bed stands against the wall.",
            "It looks warm and surprisingly comfortable."
        ]
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
