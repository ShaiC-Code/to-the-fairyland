import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { choiceOption, dialogue, dialogueWithChoice } from "../../InteractionSystem/InteractionDatabase";
import { ItemUseActions } from "../ItemUseActions";

export default class FreshPrettyTooth extends InventoryItem {
    public constructor(){
        super();
    }

    public displayName(): string {
        return "FRESH PRETTY TOOTH";
    }

    public consume(context: InventoryItemConsumeContext): void {
        const result = context.previewItemAction(ItemUseActions.HOLD_UP_TOOTH);

        if (!result.success) {
            context.showDialogue(dialogue(result.lines));
            return;
        }

        context.showDialogue(
            dialogueWithChoice(
                ["Hold up the fresh pretty tooth?"],
                {
                    lineIndex: 0,
                    options: [
                        choiceOption(
                            "Yes",
                            dialogue(
                                ["You hold up the fresh pretty tooth."],
                                {
                                    onComplete: () => context.runItemAction(ItemUseActions.HOLD_UP_TOOTH)
                                }
                            )
                        ),
                        choiceOption(
                            "No",
                            dialogue(["You put the tooth away."])
                        )
                    ]
                }
            )
        );
    }
}
