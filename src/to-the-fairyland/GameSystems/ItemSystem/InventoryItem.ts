import Unique from "../../../Wolfie2D/DataTypes/Interfaces/Unique";
import Inventory from "./Inventory";
import { DialogueInteraction } from "../InteractionSystem/InteractionDatabase";
import { ItemUseAction, ItemUseResult } from "./ItemUseActions";

export interface InventoryItemConsumeContext {
    showDialogue: (interaction: DialogueInteraction) => void;
    previewItemAction: (action: ItemUseAction) => ItemUseResult;
    runItemAction: (action: ItemUseAction) => ItemUseResult;
}

/**
 * Base class for items that live in the inventory as pure data.
 * Unlike the old template Item class, this version does not depend on sprites.
 */
export default abstract class InventoryItem implements Unique {
    /** Used to give every inventory item instance its own unique id. */
    private static NEXT_ID: number = 0;

    /** Unique id for this specific item instance. */
    protected readonly __id: number;

    /**
     * The inventory currently holding this item.
     * Null means the item has not been added to an inventory yet.
     */
    protected _inventory: Inventory | null;

    protected constructor() {
        this.__id = InventoryItem.NEXT_ID;
        InventoryItem.NEXT_ID += 1;

        this._inventory = null;
    }

    /** Unique id required by the inventory map. */
    public get id(): number {
        return this.__id;
    }

    /** The inventory that currently owns this item, if any. */
    public get inventory(): Inventory | null {
        return this._inventory;
    }

    public set inventory(value: Inventory | null) {
        this._inventory = value;
    }

    /**
     * User-facing label for UI like the inventory menu.
     * Each item subclass should return its own name.
     */
    public abstract displayName(): string;

    /**
     * Handles using this item from the inventory UI.
     * Each item decides whether this consumes, confirms, or only shows a description.
     */
    public abstract consume(context: InventoryItemConsumeContext): void;
}