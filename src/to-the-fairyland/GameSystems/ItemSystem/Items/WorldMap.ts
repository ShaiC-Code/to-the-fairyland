import InventoryItem from "../InventoryItem";

export default class WorldMap extends InventoryItem {
    public constructor(){
        super();
    }

    public displayName(): string {
        return "WORLD MAP";
    }
}