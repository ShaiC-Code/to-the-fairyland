import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import { dialogue } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import EmeraldPondScene from "../Chapter7/EmeraldPondScene";
import DesertSceneBase from "./DesertSceneBase";

export default class DesertPondScene extends DesertSceneBase {
    protected readonly tilemap = {
        key: "desertPond",
        path: "/assets/tilemaps/Chapter4/DesertPond.json"
    };

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "EmeraldPond") {
            this.startDialogue(dialogue(
                [
                    "The emerald water shines like a doorway.",
                    "You step into the pond."
                ],
                { onComplete: () => this.gotoEmeraldPond() }
            ));
            return;
        }

        this.tryStartInteractionDialogue(obj);
    }

    private gotoEmeraldPond(): void {
        if (this.transitioning) {
            return;
        }

        this.transitioning = true;
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
}
