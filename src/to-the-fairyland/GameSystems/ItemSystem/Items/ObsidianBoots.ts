import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { dialogue } from "../../InteractionSystem/InteractionDatabase";

export default class ObsidianBoots extends InventoryItem {
    public constructor() {
        super();
    }

    public displayName(): string {
        return "OBSIDIAN BOOTS";
    }

    public consume(context: InventoryItemConsumeContext): void {
        context.showDialogue(
            dialogue([
                "A pair of hard and heavy boots.",
            ])
        );
    }
}
