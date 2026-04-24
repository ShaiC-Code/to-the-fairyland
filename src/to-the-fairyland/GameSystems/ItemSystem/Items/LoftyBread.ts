import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { dialogue } from "../../InteractionSystem/InteractionDatabase";

export default class LoftyBread extends InventoryItem {
    public constructor() {
        super();
    }

    public displayName(): string {
        return "LOFTY BREAD";
    }

    public consume(context: InventoryItemConsumeContext): void {
        context.showDialogue(
            dialogue([
                "A soft loaf wrapped with patient care.",
                "Looks delicious..."
            ])
        );
    }
}
