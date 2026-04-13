import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import StoryManager from "../../StorySystem/StoryManager";
import { choiceOption, dialogue, dialogueWithChoice } from "../../InteractionSystem/InteractionDatabase";

/**
 * One inventory bundle of cooked berries.
 */
export default class CookedBerries extends InventoryItem {
    /** How many berries this bundle represents. */
    protected amount: number;

    public constructor(amount: number = 1) {
        super();
        this.amount = amount;
    }

    public displayName(): string {
        return "COOKED BERRIES";
    }

    public get berryCount(): number {
        return this.amount;
    }

    public set berryCount(value: number) {
        this.amount = Math.max(0, value);
    }

    public consume(context: InventoryItemConsumeContext): void {
        context.showDialogue(
            dialogueWithChoice(
                ["Eat the cooked berries?"],
                {
                    lineIndex: 0,
                    options: [
                        choiceOption(
                            "Yes",
                            dialogue(["You eat the cooked berries."]),
                            { onSelect: () => this.consumeConfirmed() }
                        ),
                        choiceOption(
                            "No",
                            dialogue(["You put the cooked berries away."])
                        )
                    ]
                }
            )
        );
    }

    private consumeConfirmed(): void {
        if (this.inventory?.remove(this.id)) {
            StoryManager.getInstance().markFoodConsumed();
        }
    }
}
