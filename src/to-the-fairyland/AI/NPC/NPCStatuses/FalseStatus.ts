import GoapState from "../../../../Wolfie2D/AI/Goap/GoapState";

export default class FalseStatus extends GoapState {
    public isSatisfied(): boolean {
        return false;
    }
}