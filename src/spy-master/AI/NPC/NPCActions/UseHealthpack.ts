import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import Battler from "../../../GameSystems/BattleSystem/Battler";
import Healthpack from "../../../GameSystems/ItemSystem/Items/Healthpack";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import NPCAction from "./NPCAction";
import Finder from "../../../GameSystems/Searching/Finder";


export default class UseHealthpack extends NPCAction {
    
    // The targeting strategy used for this GotoAction - determines how the target is selected basically
    protected override _targetFinder: Finder<Battler>;
    // The targets or Targetable entities 
    protected override _targets: Battler[];
    // The target we are going to set the actor to target
    protected override _target: Battler | null;

    public constructor(parent: NPCBehavior, actor: NPCActor) { 
        super(parent, actor);
    }

    public performAction(target: Battler): void {
        // Find if there is a health pack in the healer's inventory | return the health pack or null
        let healthPack = this.actor.inventory.find(item => item.constructor === Healthpack) as Healthpack | null;

        if(healthPack !== null && target.health < target.maxHealth / 2) {
            // add health to the target
            target.health = Math.min(target.health + healthPack.health, target.maxHealth);
            // remove the used healthpack 
            this.actor.inventory.remove(healthPack.id);
        }

        // mark this action as finished so it Changes GoapAction state
        this.finished();
    }

    protected override isTargetStillValid(target: TargetableEntity): boolean {
        if (!super.isTargetStillValid(target)) {
            return false;
        }

        let battler = target as Battler;
        return battler.battlerActive && battler.health > 0 && battler.health <= battler.maxHealth / 2;
    }

}