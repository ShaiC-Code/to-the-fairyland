import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { choiceOption, dialogue, dialogueWithChoice } from "../../InteractionSystem/InteractionDatabase";
import { ItemUseActions } from "../ItemUseActions";

export default class SleepingBag extends InventoryItem {
    public constructor() {
        super();
    }

    public displayName(): string {
        return "SLEEPING BAG";
    }

    public consume(context: InventoryItemConsumeContext): void {
        const result = context.previewItemAction(ItemUseActions.SLEEP_WITH_SLEEPING_BAG);

        context.showDialogue(
            dialogueWithChoice(
                ["Would you like to sleep now?"],
                {
                    lineIndex: 0,
                    options: [
                        choiceOption(
                            "Yes",
                            dialogue(result.lines),
                            result.success
                                ? { onSelect: () => context.runItemAction(ItemUseActions.SLEEP_WITH_SLEEPING_BAG) }
                                : undefined
                        ),
                        choiceOption(
                            "No",
                            dialogue(["You put the sleeping bag away."])
                        )
                    ]
                }
            )
        );
    }
}
