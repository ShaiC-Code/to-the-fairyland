import RoadSceneBase from "./RoadSceneBase";
import Road3Scene from "./Road3Scene";
import {
    choiceOption,
    dialogue,
    dialogueWithChoice
} from "../../GameSystems/InteractionSystem/InteractionDatabase";
import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";



export default class CliffScene extends RoadSceneBase {
    private cliffJumpLycansSpawned = false;

    protected readonly tilemap = {
        key: "cliff",
        path: "/assets/tilemaps/Chapter2/Cliff.json"
    };

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToRoad3") {
            this.changeToRoadSection(Road3Scene, "RoadEnd");
        }
    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "Cliff_Jump") {
            this.spawnCliffJumpLycans();
            this.startCliffJumpDialogue();
            return;
        }

        this.tryStartInteractionDialogue(obj);
    }

    private spawnCliffJumpLycans(): void {
        if (this.cliffJumpLycansSpawned) {
            return;
        }
    
        const tilemapData = this.resourceManager.getTilemap(this.tilemap.key) as TiledTilemapData;
    
        this.spawnLycansMatching(tilemapData, obj =>
            obj.name === "Lycan1" || obj.name === "Lycan2"
        );
    
        this.startAllLycanChases();
        this.cliffJumpLycansSpawned = true;
    }
    

    private startCliffJumpDialogue(): void {
        this.setWorldTimeScale(0.1);

        this.startDialogue(
            dialogueWithChoice(
                [
                    "The cliff drops into darkness.",
                    "Jump off the cliff?"
                ],
                {
                    lineIndex: 1,
                    options: [
                        choiceOption(
                            "Yes",
                            dialogue(
                                [
                                    "You step forward."
                                ],
                                {
                                    onComplete: async () => {
                                        this.setWorldTimeScale(1);
                                        this.lockPlayerInput();
                                        await this.movePlayerOneTileForwardAsync({ ignoreCollision: true });
                                        this.gotoChapter3();
                                    }
                                }
                            )
                        ),
                        choiceOption(
                            "No",
                            dialogue(
                                [
                                    "You step back from the edge."
                                ],
                                {
                                    onComplete: async () => {
                                        this.setWorldTimeScale(1);
                                        this.lockPlayerInput();
                                        await this.movePlayerOneTileBackwardAsync();
                                        await this.waitSeconds(0.5);
                                        this.setPlayerFacing(Vec2.DOWN);
                                        
                                    }
                                }
                            )
                        )
                    ]
                }
            ),
            undefined,
            { layoutMode: "topRightQuarter" }
        );
    }
}

