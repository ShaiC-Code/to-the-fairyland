import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";
import { dialogue } from "../../InteractionSystem/InteractionDatabase";

export default class WorldMap extends InventoryItem {
    public constructor(){
        super();
    }

    public displayName(): string {
        return "WORLD MAP";
    }

    public consume(context: InventoryItemConsumeContext): void {
        context.showDialogue(
            dialogue([
                "A weathered map marked with three monster kingdoms.",
                "One note is circled in red ink: 'TheFairyLand.'"
            ])
        );
    }
}