import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { dialogue } from "../../InteractionSystem/InteractionDatabase";

export default class SleepingBag extends InventoryItem {
    public constructor() {
        super();
    }

    public displayName(): string {
        return "SLEEPING BAG";
    }

    public consume(context: InventoryItemConsumeContext): void {
        context.showDialogue(
            dialogue([
                "A normal sleeping bag.",
            ])
        );
    }
}
