import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { dialogue } from "../../InteractionSystem/InteractionDatabase";

export default class FlowerRing extends InventoryItem {
    public constructor(){
        super();
    }

    public displayName(): string {
        return "FLOWER RING";
    }

    public consume(context: InventoryItemConsumeContext): void {
        context.showDialogue(
            dialogue([
                "A small ring woven from pale flowers.",
                "J hoped it would bring you luck."
            ])
        );
    }
}
