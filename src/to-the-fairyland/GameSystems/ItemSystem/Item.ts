import Unique from "../../../Wolfie2D/DataTypes/Interfaces/Unique";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Emitter from "../../../Wolfie2D/Events/Emitter";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import BasicTargetable from "../Targeting/BasicTargetable";
import Inventory from "./Inventory";
import TargetableEntity from "../Targeting/TargetableEntity";
import TargetingEntity from "../Targeting/TargetingEntity";

export default abstract class Item implements Unique, TargetableEntity {
    protected sprite: Sprite;
    protected emitter: Emitter;

    protected _inventory: Inventory | null;
    protected _targetable: TargetableEntity;

    protected constructor(sprite: Sprite){ 
        this.sprite = sprite;
        this.emitter = new Emitter();

        this._inventory = null;
        this._targetable = new BasicTargetable(this.sprite);
    }

    getTargeting(): TargetingEntity[] { 
        return this._targetable.getTargeting(); 
    }
    addTargeting(targeting: TargetingEntity): void {
        this._targetable.addTargeting(targeting);
    }
    removeTargeting(targeting: TargetingEntity): void {
        this._targetable.removeTargeting(targeting);
    }
    
    public get relativePosition(): Vec2 { return this.sprite.relativePosition; }

    public get id(): number { return this.sprite.id; }

    public get position(): Vec2 { return this.sprite.position; }

    public get visible(): boolean { return this.sprite.visible; }
    public set visible(value: boolean) { this.sprite.visible = value; }

    public get inventory(): Inventory | null { return this._inventory; }
    public set inventory(value: Inventory | null) { this._inventory = value; }

    /**
     * User-facing label for menus like the inventory screen.
     * Subclasses can override this with a more specific item name.
     */
    public get displayName(): string {
        return "Item";
    }


}