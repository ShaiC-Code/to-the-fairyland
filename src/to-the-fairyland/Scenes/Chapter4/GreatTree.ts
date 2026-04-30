import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestSceneBase from "../ForestSceneBase";
import DeeperForestScene from "./DeeperForest";
// import TreeInnerScene from "./TreeInner";

export default class GreatTreeScene extends ForestSceneBase {
    protected readonly tilemap = {
        key: "greatTree",
        path: "/assets/tilemaps/Chapter4/GreatTree.json"
    };

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToDeeperForest") {
            this.changeToForestSection(DeeperForestScene, "RoadEnd");
        }
    }
}