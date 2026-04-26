import { Chapter1MainQuestStep } from "../StorySystem/StoryState";
import {
    choiceOption,
    dialogue,
    dialogueWithChoice,
    DialogueChoiceActions,
    DialogueCompleteActions,
    DialogueInteraction,
    InteractionData
} from "./InteractionTypes";

/**
 * Dialogue definitions for non-NPC world objects.
 * Static entries live in the table below, while story-sensitive objects use small
 * helper functions so they can branch on quest progress.
 */
const STATIC_OBJECT_INTERACTIONS: Readonly<Record<string, InteractionData>> = {
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
                    dialogue(["<yellow>[You received Frozen Berries]"]),
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
            "It's from the expedition members.",
            "Three monster kingdoms have broken through the human territories.",
            "A distant land is marked in trembling ink...",
            "<red>'The FairyLand'",
            "A message sits beside it.",
            "<red>'Humanity's last hope.'",
            "Pick up map?"
        ],
        {
            lineIndex: 7,
            options: [
                choiceOption(
                    "Yes",
                    dialogue([
                        "<yellow>[You obtained the World Map]",
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

// Used by the generic map-object interaction flow in MappedAdventureScene.
export function getObjectInteraction(interactionId: string): InteractionData | undefined {
    return STATIC_OBJECT_INTERACTIONS[interactionId];
}

// Beds are story-aware, so they are resolved by quest step instead of a static table entry.
export function getBedDialogue(step: Chapter1MainQuestStep): DialogueInteraction {
    switch (step) {
    case Chapter1MainQuestStep.NEED_FOOD:
    case Chapter1MainQuestStep.NEED_TO_COOK:
    case Chapter1MainQuestStep.NEED_TO_EAT:
        return dialogue([
            "The bed looks warm and surprisingly comfortable.",
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
            { completeAction: DialogueCompleteActions.GOTO_CHAPTER2 }
        );

    default:
        return dialogue(["..."]);
    }
}

// Pots are also story-aware because their options depend on player progress.
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
                        dialogue(["<yellow>[You obtained Cooked Berries]"]),
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
