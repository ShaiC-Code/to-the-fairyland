import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import RoadSceneBase from "./RoadSceneBase";
import RoadScene from "./RoadScene";
import Road2Scene from "./Road2Scene";

export default class Road1Scene extends RoadSceneBase {
    protected readonly tilemap = {
        key: "road1",
        path: "/assets/tilemaps/Chapter2/Road1.json"
    };

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToRoad") {
            this.changeToRoadSection(RoadScene, "RoadEnd");
        } else if (obj.name === "PathToRoad2") {
            this.changeToRoadSection(Road2Scene, "RoadStart");
        }
    }

    protected override getLycanChaseSpawnPrefix(): string | null {
        if (this.spawnName === "RoadStart") return "ChaseFromRoad";
        if (this.spawnName === "RoadEnd") return "ChaseFromRoad2";
        return null;
    }
    
}
