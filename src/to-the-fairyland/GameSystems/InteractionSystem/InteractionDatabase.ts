import type { InteractionData } from "./InteractionTypes";
import { getObjectInteraction } from "./ObjectInteractions";

/**
 * Thin compatibility layer for the interaction system.
 * Other files can keep importing from one place while the actual content is split
 * across shared types, object interactions, and NPC interactions.
 */
export * from "./InteractionTypes";
export * from "./ObjectInteractions";
export * from "./NpcInteractions";

// The existing generic scene lookup path currently targets map/object interactions.
export function getInteractionData(interactionId: string): InteractionData | undefined {
    return getObjectInteraction(interactionId);
}
