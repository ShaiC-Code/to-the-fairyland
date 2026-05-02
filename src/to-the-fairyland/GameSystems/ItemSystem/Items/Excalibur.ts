import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { dialogue } from "../../InteractionSystem/InteractionDatabase";

export default class Excalibur extends InventoryItem {
    public constructor() {
        super();
    }

    public displayName(): string {
        return "EXCALIBUR";
    }

    public consume(context: InventoryItemConsumeContext): void {
        context.showDialogue(
            dialogue([
                "The legendary sword Excalibur.",
                "Its blade hums with buried power."
            ])
        );
    }
}
