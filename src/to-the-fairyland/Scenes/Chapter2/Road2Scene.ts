import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import RoadSceneBase from "./RoadSceneBase";
import Road1Scene from "./Road1Scene";
import Road3Scene from "./Road3Scene";

export default class Road2Scene extends RoadSceneBase {
    protected readonly tilemap = {
        key: "road2",
        path: "/assets/tilemaps/Chapter2/Road2.json"
    };

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToRoad1") {
            this.changeToRoadSection(Road1Scene, "RoadEnd");
        } else if (obj.name === "PathToRoad3") {
            if (this.storyManager.chapter2.needsToLeaveVillage()) {
                this.storyManager.chapter2.markLeaveVillage();
            }
            this.changeToRoadSection(Road3Scene, "RoadStart");
        }
    }

    protected override getLycanChaseSpawnPrefix(): string | null {
        if (this.spawnName === "RoadStart") return "ChaseFromRoad1";
        if (this.spawnName === "RoadEnd") return "ChaseFromRoad3";
        return null;
    }
}
