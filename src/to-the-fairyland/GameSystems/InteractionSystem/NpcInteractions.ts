import {
    DialogueInteraction,
    dialogue,
    dialogueWithChoice,
    choiceOption,
    DialogueChoiceActions
} from "./InteractionTypes";
import { Chapter2MainQuestStep, Chapter2StoryState } from "../StorySystem/StoryState";

export interface NpcInteractionContext {
    chapter2?: Readonly<Chapter2StoryState>;
}

export function getNpcInteraction(
    npcName: string,
    context: NpcInteractionContext = {}
): DialogueInteraction | undefined {
    switch (npcName) {
    case "Lucy":
        return getLucyInteraction(context);

    case "Vila":
        return getVilaInteraction(context);

    case "Argus":
        return getArgusInteraction(context);

    case "J":
        return getJInteraction(context);

    case "K":
        return getKInteraction(context);

    default:
        return undefined;
    }
}

// ----------------Vila Dialogue------------------------
function getVilaInteraction(context: NpcInteractionContext): DialogueInteraction {
    const chapter2 = context.chapter2;

    if (!chapter2) {
        return dialogue(["...Vila..."]);
    }

    switch (chapter2.mainQuestStep) {
    case Chapter2MainQuestStep.COLLECT_VILLAGE_ITEMS:
        if (chapter2.villageItems.gotVilaTooth) {
            return dialogue([
                "You still have my little gift, don't you?",
                "Good.",
                "Pretty things should stay close."
            ]);
        }

        return dialogueWithChoice(
            [
                "Oh... hello, traveler.",
                "You came from outside the village, right?",
                "Let me see... ah, I kept something nice.",
                "It is one of my precious little things.",
                "A pretty little tooth. I kept it because it was pretty.",
                "Will you take my gift?"
            ],
            {
                lineIndex: 5,
                options: [
                    choiceOption(
                        "Yes",
                        dialogue([
                            "Vila smiles and presses the tooth into your hand.",
                            "It is warmer than you expected.",
                            "You received a Fresh Pretty Tooth."
                        ]),
                        { choiceAction: DialogueChoiceActions.TAKE_FRESH_PRETTY_TOOTH }
                    ),
                    choiceOption(
                        "No",
                        dialogue([
                            "Vila's smile stays in place.",
                            "Oh. That is alright.",
                            "I will keep it a little longer."
                        ])
                    )
                ]
            }
        );

    case Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE:
        return dialogue([
            "You still have my little gift, don't you?",
            "Good.",
            "Pretty things should stay close."
        ]);

    default:
        return dialogue(["...Vila..."]);
    }
}

// ----------------Lucy Dialogue------------------------
function getLucyInteraction(context: NpcInteractionContext): DialogueInteraction {
    const chapter2 = context.chapter2;

    if (!chapter2) {
        return dialogue(["...Lucy..."]);
    }

    switch (chapter2.mainQuestStep) {
    case Chapter2MainQuestStep.COLLECT_VILLAGE_ITEMS:
        return dialogue([
            "...Lucy..."
        ]);

    case Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE:
        return dialogue([
            "...Lucy after village items..."
        ]);

    default:
        return dialogue(["...Lucy..."]);
    }
}

// ----------------Argus Dialogue------------------------
function getArgusInteraction(context: NpcInteractionContext): DialogueInteraction {
    const chapter2 = context.chapter2;

    if (!chapter2) {
        return dialogue(["...Argus..."]);
    }

    switch (chapter2.mainQuestStep) {
    case Chapter2MainQuestStep.COLLECT_VILLAGE_ITEMS:
        return dialogue([
            "...Argus..."
        ]);

    case Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE:
        return dialogue([
            "...Argus after village items..."
        ]);

    default:
        return dialogue(["...Argus..."]);
    }
}

// ----------------J Dialogue------------------------
function getJInteraction(context: NpcInteractionContext): DialogueInteraction {
    const chapter2 = context.chapter2;

    if (!chapter2) {
        return dialogue(["...J..."]);
    }

    switch (chapter2.mainQuestStep) {
    case Chapter2MainQuestStep.COLLECT_VILLAGE_ITEMS:
        return dialogue([
            "...J..."
        ]);

    case Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE:
        return dialogue([
            "...J after village items..."
        ]);

    default:
        return dialogue(["...J..."]);
    }
}

// ----------------K Dialogue------------------------
function getKInteraction(context: NpcInteractionContext): DialogueInteraction {
    const chapter2 = context.chapter2;

    if (!chapter2) {
        return dialogue(["...K..."]);
    }

    switch (chapter2.mainQuestStep) {
    case Chapter2MainQuestStep.COLLECT_VILLAGE_ITEMS:
        return dialogue([
            "...K..."
        ]);

    case Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE:
        return dialogue([
            "...K after village items..."
        ]);

    default:
        return dialogue(["...K..."]);
    }
}
