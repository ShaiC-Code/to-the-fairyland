import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import RoadSceneBase from "./RoadSceneBase";
import VillageScene from "./VillageScene";
import Road1Scene from "./Road1Scene";

export default class RoadScene extends RoadSceneBase {
    protected readonly tilemap = {
        key: "road",
        path: "/assets/tilemaps/Chapter2/Road.json"
    };

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToVillage") {
            this.changeToRoadSection(VillageScene, "RoadEnd");
        } else if (obj.name === "PathToRoad1") {
            this.changeToRoadSection(Road1Scene, "RoadStart");
        }
    }

    protected override getLycanChaseSpawnPrefix(): string | null {
        if (this.spawnName === "RoadStart") return "ChaseFromVillage";
        if (this.spawnName === "RoadEnd") return "ChaseFromRoad1";
        return null;
    }
    
}
