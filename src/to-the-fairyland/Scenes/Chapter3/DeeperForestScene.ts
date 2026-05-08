import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestSceneBase from "./ForestSceneBase";
import CliffBottomScene from "./CliffBottomScene";
import GreatTreeScene from "./GreatTreeScene";

export default class DeeperForestScene extends ForestSceneBase {
    protected readonly tilemap = {
        key: "deeperForest",
        path: "/assets/tilemaps/Chapter3/DeeperForest.json"
    };

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToCliffBottom") {
            this.changeToForestSection(CliffBottomScene, "RoadEnd");
        } else if (obj.name === "PathToGreatTree") {
            this.changeToForestSection(GreatTreeScene, "RoadStart");
        }
    }
    
}
