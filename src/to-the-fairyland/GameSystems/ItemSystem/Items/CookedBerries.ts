import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import StoryManager from "../../StorySystem/StoryManager";

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
        context.showDialogue({
            type: "dialogue",
            lines: ["Eat the cooked berries?"],
            choice: {
                lineIndex: 0,
                options: [
                    {
                        label: "Yes",
                        onSelect: () => this.consumeConfirmed(),
                        interaction: {
                            type: "dialogue",
                            lines: ["You eat the cooked berries."]
                        }
                    },
                    {
                        label: "No",
                        interaction: {
                            type: "dialogue",
                            lines: ["You put the cooked berries away."]
                        }
                    }
                ]
            }
        });
    }

    private consumeConfirmed(): void {
        if (this.inventory?.remove(this.id)) {
            StoryManager.getInstance().markFoodConsumed();
        }
    }
}
