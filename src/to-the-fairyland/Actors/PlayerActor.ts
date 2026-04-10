import Spritesheet from "../../Wolfie2D/DataTypes/Spritesheet";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { BattlerEvent, ItemEvent } from "../Events";
import BasicBattler from "../GameSystems/BattleSystem/BasicBattler";
import Battler from "../GameSystems/BattleSystem/Battler";
import Inventory from "../GameSystems/ItemSystem/Inventory";
import SMItem from "../GameSystems/ItemSystem/Item";
import BasicTargetable from "../GameSystems/Targeting/BasicTargetable";
import { TargetableEntity } from "../GameSystems/Targeting/TargetableEntity";
import { TargetingEntity } from "../GameSystems/Targeting/TargetingEntity";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";


export default class PlayerActor extends AnimatedSprite implements Battler {

    /** Give the player a battler compoonent */
    protected battler: Battler;
    protected targetable: TargetableEntity;

    protected heldItem: SMItem;

    public spriteOffset = new Vec2(0, 20);

    public getCenterForFeetPosition(feetX: number, feetY: number): Vec2 {
        return new Vec2(feetX, feetY - this.size.y / 2).add(this.spriteOffset);
    }


    constructor(sheet: Spritesheet) {
        super(sheet);
        this.battler = new BasicBattler(this);
        this.targetable = new BasicTargetable(this);

        this.receiver.subscribe(ItemEvent.LASERGUN_FIRED)
        this.receiver.subscribe(BattlerEvent.BATTLER_KILLED)
    }

    get battlerActive(): boolean {
        return this.battler.battlerActive;
    }
    set battlerActive(value: boolean) {
        this.battler.battlerActive = value;
        this.visible = value;
    }
    
    public getTargeting(): TargetingEntity[] { return this.targetable.getTargeting(); }
    public addTargeting(targeting: TargetingEntity): void { this.targetable.addTargeting(targeting); }
    public removeTargeting(targeting: TargetingEntity): void { this.targetable.removeTargeting(targeting); }

    get battleGroup(): number {
        return this.battler.battleGroup;
    }
    set battleGroup(value: number) {
        this.battler.battleGroup = value;
    }
    get maxHealth(): number {
        return this.battler.maxHealth;
    }
    set maxHealth(value: number) {
        this.battler.maxHealth = value;
    }
    get health(): number {
        return this.battler.health;
    }
    set health(value: number) {
        this.battler.health = value;
        if (this.health <= 0) {
            this.emitter.fireEvent(BattlerEvent.BATTLER_KILLED, {id: this.id});
        }
    }
    get speed(): number {
        return this.battler.speed;
    }
    set speed(value: number) {
        this.battler.speed = value;
    }
    get inventory(): Inventory {
        return this.battler.inventory;
    }
}
