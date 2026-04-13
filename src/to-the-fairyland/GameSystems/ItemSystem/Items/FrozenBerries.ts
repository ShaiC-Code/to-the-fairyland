import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { dialogue } from "../../InteractionSystem/InteractionDatabase";

/**
 * One inventory bundle of frozen berries.
 */
export default class FrozenBerries extends InventoryItem {
    /** How many berries this bundle represents. */
    protected amount: number;

    public constructor(amount: number = 1) {
        super();
        this.amount = amount;
    }

    public displayName(): string {
        return "FROZEN BERRIES";
    }

    public get berryCount(): number {
        return this.amount;
    }

    public set berryCount(value: number) {
        this.amount = Math.max(0, value);
    }

    public consume(context: InventoryItemConsumeContext): void {
        context.showDialogue(
            dialogue([
                "These berries are frozen solid.",
                "You should cook them before eating."
            ])
        );
    }
}
