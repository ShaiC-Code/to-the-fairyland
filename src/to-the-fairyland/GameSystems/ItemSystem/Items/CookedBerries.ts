import InventoryItem from "../InventoryItem";

/**
 * One inventory bundle of cooked berries.
 */
export default class CookedBerries extends InventoryItem {
    /** How many berries this bundle represents. */
    protected amount: number;

    public constructor(amount: number = 1) {
        super();
        this.amount = amount;
    }

    public displayName(): string {
        return "COOKED BERRIES";
    }

    public get berryCount(): number {
        return this.amount;
    }

    public set berryCount(value: number) {
        this.amount = Math.max(0, value);
    }
}
