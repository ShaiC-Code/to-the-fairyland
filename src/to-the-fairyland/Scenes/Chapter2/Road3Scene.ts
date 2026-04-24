import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import RoadSceneBase from "./RoadSceneBase";
import Road2Scene from "./Road2Scene";
import CliffScene from "./CliffScene";

export default class Road3Scene extends RoadSceneBase {
    protected readonly tilemap = {
        key: "road3",
        path: "/assets/tilemaps/Chapter2/Road3.json"
    };

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToRoad2") {
            this.changeToRoadSection(Road2Scene, "RoadEnd");
        } else if (obj.name === "PathToCliff") {
            this.changeToRoadSection(CliffScene, "RoadStart");
        }
    }
}
