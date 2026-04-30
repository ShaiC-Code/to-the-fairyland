import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestSceneBase from "../ForestSceneBase";
import DeeperForestScene from "./DeeperForest";


export default class CliffBottomScene extends ForestSceneBase {
    protected readonly tilemap = {
        key: "cliffBottom",
        path: "/assets/tilemaps/Chapter4/CliffBottom.json"
    };

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToDeeperForest") {
            this.changeToForestSection(DeeperForestScene, "RoadStart");
        }
    }
}
