import {
    DialogueInteraction,
    dialogue,
    dialogueWithChoice,
    choiceOption,
    DialogueChoiceActions,
    DialogueCompleteActions
} from "./InteractionTypes";
import { Chapter2MainQuestStep, Chapter2StoryState, Chapter2VillageItem } from "../StorySystem/StoryState";

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
        if (chapter2.villageItems[Chapter2VillageItem.FRESH_PRETTY_TOOTH]) {
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
            "You are standing directly in my sightline.",
            "Do you have any idea how difficult it is to enjoy a private pool when people keep wandering through the view?",
            "Move along."
        ]);

    case Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE:
        return dialogue([
            "Why are you still here?"
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
        if (chapter2.villageItems[Chapter2VillageItem.FLOWER_RING]) {
            return dialogue([
                "May the peace be with us..."
            ]);
        }

        return dialogue([
            "Last night... did you hear it?",
            "There was a howl somewhere.",
            "I have not been able to stop thinking about it.",
            "Here. Please take this flower ring.",
            "I hope it brings you some luck.",
            "A flower ring is placed in your hand."
        ], { completeAction: DialogueCompleteActions.GIVE_FLOWER_RING });

    case Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE:
        return dialogue([
            "You are leaving soon, aren't you?",
            "Please be careful beyond the village.",
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
