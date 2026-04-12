import Unique from "../../../Wolfie2D/DataTypes/Interfaces/Unique";
import Emitter from "../../../Wolfie2D/Events/Emitter";
import InventoryItem from "./InventoryItem";

/**
 * A container for pure-data inventory items.
 */
export default class Inventory implements Unique {
    /** The id number of the next inventory. */
    private static NEXT_ID = 0;

    /** The id of this inventory. */
    protected __id: number;

    /** The collection of items in this inventory. */
    protected _inventory: Map<number, InventoryItem>;

    /** Whether the inventory contents changed since last clean(). */
    protected _dirty: boolean;

    /** The maximum number of items this inventory can hold. */
    protected _capacity: number;

    /** The number of items currently in this inventory. */
    protected _size: number;

    /** Optional event name to fire when inventory changes are committed. */
    protected _onChange: string | null;

    /** Emits inventory change events. */
    protected _emitter: Emitter;

    public constructor(capacity: number = 10) {
        this.__id = Inventory.NEXT_ID;
        Inventory.NEXT_ID += 1;

        this.inventory = new Map<number, InventoryItem>();
        this._emitter = new Emitter();

        this.size = 0;
        this.capacity = capacity;
        this.dirty = false;
        this.onChange = null;
    }

    public get id(): number {
        return this.__id;
    }

    public get dirty(): boolean {
        return this._dirty;
    }

    protected set dirty(dirty: boolean) {
        this._dirty = dirty;
    }

    public get size(): number {
        return this._size;
    }

    protected set size(size: number) {
        this._size = size;
    }

    public get capacity(): number {
        return this._capacity;
    }

    protected set capacity(capacity: number) {
        this._capacity = capacity;
    }

    public get onChange(): string | null {
        return this._onChange;
    }

    public set onChange(onChange: string | null) {
        this._onChange = onChange;
    }

    protected get inventory(): Map<number, InventoryItem> {
        return this._inventory;
    }

    protected set inventory(inventory: Map<number, InventoryItem>) {
        this._inventory = inventory;
    }

    protected get emitter(): Emitter {
        return this._emitter;
    }

    protected set emitter(emitter: Emitter) {
        this._emitter = emitter;
    }

    /**
     * Gets an item from this inventory by id.
     */
    public get(id: number): InventoryItem | null {
        return this.inventory.get(id) ?? null;
    }

    /**
     * Adds an item to this inventory.
     * Returns the item if successful, or null if the add failed.
     */
    public add(item: InventoryItem): InventoryItem | null {
        if (this.has(item.id) || this.size >= this.capacity || item.inventory !== null) {
            return null;
        }

        this.inventory.set(item.id, item);
        this.size += 1;
        this.dirty = true;

        item.inventory = this;
        return item;
    }

    /**
     * Checks if an item with the given id exists in this inventory.
     */
    public has(id: number): boolean {
        return this.inventory.has(id);
    }

    /**
     * Removes the item with the given id from this inventory.
     */
    public remove(id: number): InventoryItem | null {
        const item = this.get(id);

        if (item === null) {
            return null;
        }

        this.inventory.delete(id);
        this.size -= 1;
        this.dirty = true;

        item.inventory = null;
        return item;
    }

    public items(): IterableIterator<InventoryItem> {
        return this.inventory.values();
    }

    public find(func: (item: InventoryItem) => boolean): InventoryItem | null {
        const item = Array.from(this.inventory.values()).find(func);
        return item ?? null;
    }

    public clean(): void {
        this.dirty = false;

        if (this.onChange !== null) {
            this.emitter.fireEvent(this.onChange, {
                id: this.id,
                inventory: this
            });
        }
    }
}
