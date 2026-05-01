import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestSceneBase from "../ForestSceneBase";
import DeeperForestScene from "./DeeperForestScene";
import TreeInnerScene from "./TreeInnerScene";

export default class GreatTreeScene extends ForestSceneBase {
    protected readonly tilemap = {
        key: "greatTree",
        path: "/assets/tilemaps/Chapter4/GreatTree.json"
    };

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToDeeperForest") {
            this.changeToForestSection(DeeperForestScene, "RoadEnd");
        }
        else if (obj.name === "PathToTreeInner") {
            this.changeToForestSection(TreeInnerScene, "TreeInner");
        }
    }

}