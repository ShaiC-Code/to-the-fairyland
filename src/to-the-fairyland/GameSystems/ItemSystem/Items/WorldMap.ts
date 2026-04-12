import InventoryItem, { InventoryItemConsumeContext } from "../InventoryItem";

export default class WorldMap extends InventoryItem {
    public constructor(){
        super();
    }

    public displayName(): string {
        return "WORLD MAP";
    }

    public consume(context: InventoryItemConsumeContext): void {
        context.showDialogue({
            type: "dialogue",
            lines: [
                "A weathered map marked with three monster kingdoms.",
                "One note is circled in red ink: 'TheFairyLand.'"
            ]
        });
    }
}