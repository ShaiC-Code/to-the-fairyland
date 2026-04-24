import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import RoadSceneBase from "./RoadSceneBase";
import Road3Scene from "./Road3Scene";

export default class CliffScene extends RoadSceneBase {
    protected readonly tilemap = {
        key: "cliff",
        path: "/assets/tilemaps/Chapter2/Cliff.json"
    };

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToRoad3") {
            this.changeToRoadSection(Road3Scene, "RoadEnd");
        } else if (obj.name === "Cliff") {
            this.gotoChapter3();
        }
    }
}
