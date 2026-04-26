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
                "A pretty little Tooth. I kept it because it was pretty.",
                "Will you take my gift?"
            ],
            {
                lineIndex: 5,
                options: [
                    choiceOption(
                        "Yes",
                        dialogue([
                            "<yellow>[You received a Fresh Pretty Tooth]",
                            "Vila smiles and presses the tooth into your hand.",
                            "It is warmer than you expected."
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
        if (chapter2.villageItems[Chapter2VillageItem.OBSIDIAN_BOOTS]) {
            return dialogue([
                "You should not stay here long..."
            ]);
        }

        return dialogue([
            "You are the traveler everyone keeps whispering about.",
            "Hmm. You will not get far with those worn soles.",
            "Take these Obsidian Boots.",
            "<yellow>[You received a set of Obsidian Boots]",
        ], { completeAction: DialogueCompleteActions.GIVE_OBSIDIAN_BOOTS });

    case Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE:
        return dialogue([
            "You should not stay here long..."
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
            "A flower ring is placed in your hand.",
            "<yellow>[You receieved the Flower Ring]"
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
        if (!chapter2.villageItems[Chapter2VillageItem.LOFTY_BREAD]) {
            return dialogueWithChoice(
                [
                    "Welcome.",
                    "Looks like the road has been unkind to you.",
                    "I have some tasty bread.",
                    "Would you like some?"
                ],
                {
                    lineIndex: 3,
                    options: [
                        choiceOption(
                            "Yes",
                            dialogue([
                                "<yellow>[You received Lofty Bread]",
                                "K wraps a warm loaf of bread in clean cloth and places it in your hands.",
                                "The smell is soft, buttery, and comforting."
                            ]),
                            { choiceAction: DialogueChoiceActions.TAKE_LOFTY_BREAD }
                        ),
                        choiceOption(
                            "No",
                            dialogue([
                                "K nods softly.",
                                "\"Then the offer will remain here.\""
                            ])
                        )
                    ]
                }
            );
        }

        if (!chapter2.villageItems[Chapter2VillageItem.SLEEPING_BAG]) {
            return dialogueWithChoice(
                [
                    "If the road keeps you longer than expected, take this as well.",
                    "A rolled sleeping bag will help you rest well.",
                    "Take it?"
                ],
                {
                    lineIndex: 2,
                    options: [
                        choiceOption(
                            "Yes",
                            dialogue([
                                "<yellow>[You received a Sleeping Bag]",
                                "K places a neatly rolled sleeping bag in your arms.",
                                "\"A traveler deserves warmth,\" he says."
                            ]),
                            { choiceAction: DialogueChoiceActions.TAKE_SLEEPING_BAG }
                        ),
                        choiceOption(
                            "No",
                            dialogue([
                                "K gives a small nod.",
                                "\"Then I will keep it ready in case you change your mind.\""
                            ])
                        )
                    ]
                }
            );
        }

        return dialogue([
            "I believe I have given you enough...",
            "Please don't ask for more."
        ]);

        case Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE:
            return dialogue([
                "I believe I have given you enough...",
                "Please don't ask for more."
            ]);

    default:
        return dialogue(["...K..."]);
    }
}
