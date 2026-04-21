import { DialogueInteraction, dialogue } from "./InteractionTypes";

export interface NpcInteractionContext {}

const NPC_INTERACTIONS: Readonly<Record<string, DialogueInteraction>> = {
    Lucy: dialogue([
        "...Lucy...",
    ]),

    Vila: dialogue([
        "...Vila...",
    ]),

    Argus: dialogue([
        "...Argus...",
    ]),

    J: dialogue([
        "...J..."
    ]),

    K: dialogue([
        "...K..."
    ])
};

export function getNpcInteraction(
    npcName: string,
    _context: NpcInteractionContext = {}
): DialogueInteraction | undefined {
    return NPC_INTERACTIONS[npcName];
}
