import Unique from "../../../Wolfie2D/DataTypes/Interfaces/Unique";
import TargetableEntity from "./TargetableEntity";

export default interface TargetingEntity extends Unique {
    clearTarget(): void;
    setTarget(targetable: TargetableEntity): void;
    getTarget(): TargetableEntity;
    hasTarget(): boolean;
}