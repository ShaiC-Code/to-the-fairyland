import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestSceneBase from "../ForestSceneBase";
import GreatTreeScene from "./GreatTreeScene";
// import TreeInnerScene from "./TreeInner";

export default class TreeInner extends ForestSceneBase {
    protected readonly tilemap = {
        key: "treeInner",
        path: "/assets/tilemaps/Chapter4/TreeInner.json"
    };

    protected override configureLayers(): void {
        this.getLayer("Ground").setDepth(2);
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToGreatTree") {
            this.changeToForestSection(GreatTreeScene, "TreeOuter");
        }
    }
}