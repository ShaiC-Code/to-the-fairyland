import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { dialogue } from "../../InteractionSystem/InteractionDatabase";

export default class FreshPrettyTooth extends InventoryItem {
    public constructor(){
        super();
    }

    public displayName(): string {
        return "FRESH PRETTY TOOTH";
    }

    public consume(context: InventoryItemConsumeContext): void {
        context.showDialogue(
            dialogue([
                "A freshly dropped tooth.",
                "Vila said she found it near the old path."
            ])
        );
    }
}