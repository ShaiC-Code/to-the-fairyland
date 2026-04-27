import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import RoadSceneBase from "./RoadSceneBase";
import Road2Scene from "./Road2Scene";
import CliffScene from "./CliffScene";
import { dialogue } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";


export default class Road3Scene extends RoadSceneBase {
    protected readonly tilemap = {
        key: "road3",
        path: "/assets/tilemaps/Chapter2/Road3.json"
    };

    public override startScene(): void {
        super.startScene();
        this.storyManager.chapter2.markArrivedAtRoad3();
    }
    
    protected override canUseSleepingBagHere(): boolean {
        return true;
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToRoad2") {
            if (this.storyManager.chapter2.needsToApproachCliff()) {
                this.rejectAutoTransitionEntry();
    
                this.startDialogue(dialogue([
                    "Something feels wrong behind you.",
                    "You feel an urgent pull to keep moving forward."
                ]));
    
                return;
            }
    
            this.changeToRoadSection(Road2Scene, "RoadEnd");
        } else if (obj.name === "PathToCliff") {
            if (this.storyManager.chapter2.needsToApproachCliff()) {
                this.rejectAutoTransitionEntry();
                this.triggerVillageShake();
                return;
            }
    
            if (this.storyManager.chapter2.needsToCheckVillage()) {
                this.rejectAutoTransitionEntry();
    
                this.startDialogue(dialogue([
                    "The tremor came from the village.",
                    "You need to go back."
                ]));
    
                return;
            }

            if (this.storyManager.chapter2.needsToEscapeLycans()) {
                this.changeToRoadSection(CliffScene, "RoadStart");
                return;
            }
    
            this.rejectAutoTransitionEntry();
    
            this.startDialogue(dialogue([
                "You are too exhausted to continue."
            ]));
        }
    }
    
    private triggerVillageShake(): void {
        this.storyManager.chapter2.markVillageShakeStarted();

        this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: this.assets.sounds.somethingBigSFX.key });
        this.cameraController.shake(2200, 40);
    
        this.startDialogue(dialogue(
            [
                "The ground suddenly lurches beneath your feet.",
                "The tremor came from the direction of the village."
            ],
            {
                onComplete: () => this.storyManager.chapter2.markVillageShakeComplete()
            }
        ));
    }
      
    protected override getLycanChaseSpawnPrefix(): string | null {
        if (this.spawnName === "RoadStart") return "ChaseFromRoad2";
        if (this.spawnName === "RoadEnd") return "ChaseFromCliff";
        return null;
    }
    
}
