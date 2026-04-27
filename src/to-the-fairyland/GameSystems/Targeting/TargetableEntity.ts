import Positioned from "../../../Wolfie2D/DataTypes/Interfaces/Positioned";
import TargetingEntity from "./TargetingEntity";

export default interface TargetableEntity extends Positioned {
    getTargeting(): TargetingEntity[];
    addTargeting(targeting: TargetingEntity): void;
    removeTargeting(targeting: TargetingEntity): void;
}