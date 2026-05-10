import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import AudioController from "../../GameSystems/AudioController";
import { dialogue } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import EmeraldPondScene from "../Chapter7/EmeraldPondScene";
import DesertSceneBase from "./DesertSceneBase";
import DesertPath1Scene from "./DesertPath1Scene";

export default class DesertPondScene extends DesertSceneBase {
    protected readonly tilemap = {
        key: "desertPond",
        path: "/assets/tilemaps/Chapter4/DesertPond.json"
    };

    private path1TransitionStarted = false;
    private readonly storyManager = StoryManager.getInstance();

    public override startScene(): void {
        this.path1TransitionStarted = false;
        super.startScene();
    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "EmeraldPond") {
            this.startDialogue(dialogue(
                [
                    "The emerald water shines like a doorway.",
                    "You step into the pond."
                ],
                { onComplete: () => {
                    AudioController.getInstance().playSFX(this.assets.sounds.pondSplashSFX.key);
                    this.gotoEmeraldPond();
                }}
            ));
            return;
        }

        this.tryStartInteractionDialogue(obj);
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToPath1") {
            this.gotoDesertPath1();
        }
    }

    private gotoEmeraldPond(): void {
        if (this.transitioning) {
            return;
        }

        this.transitioning = true;
        if (this.gameSessionManager.getStoryState().chapter4) {
            this.storyManager.chapter4.markJumpedIntoEmeraldPond();
        }

        this.sceneManager.changeToScene(
            EmeraldPondScene,
            {
                cheatsEnabled: this.cheatsEnabled,
                spawnName: "Fate"
            },
            undefined,
            {
                showLoadingOverlay: true,
                useFadeTransition: true,
                fadeOutMs: 500,
                fadeInMs: 500
            }
        );
    }

    private gotoDesertPath1(): void {
        if (this.path1TransitionStarted) {
            return;
        }

        this.path1TransitionStarted = true;
        this.transitioning = true;
        this.sceneManager.changeToScene(
            DesertPath1Scene,
            {
                cheatsEnabled: this.cheatsEnabled,
                spawnName: "PathToPond"
            },
            undefined,
            {
                showLoadingOverlay: true,
                useFadeTransition: true,
                fadeOutMs: 500,
                fadeInMs: 500
            }
        );
    }
}
