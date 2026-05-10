import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { choiceOption, dialogue, dialogueWithChoice } from "../../InteractionSystem/InteractionDatabase";
import { ItemUseActions } from "../ItemUseActions";

export default class LoftyBread extends InventoryItem {
    public constructor() {
        super();
    }

    public displayName(): string {
        return "LOFTY BREAD";
    }

    public consume(context: InventoryItemConsumeContext): void {
        const result = context.previewItemAction(ItemUseActions.EAT_LOFTY_BREAD);

        if (!result.success) {
            context.showDialogue(dialogue(result.lines));
            return;
        }

        context.showDialogue(
            dialogueWithChoice(
                ["Eat some lofty bread?"],
                {
                    lineIndex: 0,
                    options: [
                        choiceOption(
                            "Yes",
                            dialogue(
                                result.lines,
                                {
                                    onComplete: () => context.runItemAction(ItemUseActions.EAT_LOFTY_BREAD)
                                }
                            )
                        ),
                        choiceOption(
                            "No",
                            dialogue(["You put the lofty bread away."])
                        )
                    ]
                }
            )
        );
    }
}
