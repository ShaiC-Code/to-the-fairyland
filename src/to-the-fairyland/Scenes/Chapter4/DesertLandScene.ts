import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import { choiceOption, dialogue, dialogueWithChoice } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import TitleOverlay from "../../Overlays/TitleOverlay";
import { AssetBundle } from "../MappedAdventureScene";
import DesertLandParallaxScene from "./DesertLandParallaxScene";
import DesertSceneBase from "./DesertSceneBase";

export default class DesertLandScene extends DesertSceneBase {
    private readonly signScale = 1.25;

    protected readonly tilemap = {
        key: "desertLand",
        path: "/assets/tilemaps/Chapter4/DesertLand.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            signSprite: { key: "sign", path: "/assets/sprites/Sign.png" }
        },
        sounds: {},
        images: {}
    };

    private introTitleOverlay!: TitleOverlay;
    private readonly introTitleLayerName = "DesertIntroTitleOverlay";
    private readonly introTitleText = "Fairyland is right ahead.";
    private readonly introTitleDurationSeconds = 3;

    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), DesertLandScene.assetBundle);
    }
    
    public override startScene(): void {
        super.startScene();
        this.showIntroTitle();
    }

    protected override configureLayers(): void {
        super.configureLayers();
        this.getLayer(this.interactablesLayerName).setDepth(this.actorLayerDepth);
        this.introTitleOverlay = new TitleOverlay(
            this.introTitleLayerName,
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            {
                fontSize: 52,
                pauseScene: true
            }
        );
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);

        const interactLayer = tilemapData.layers.find(layer => layer.name === this.interactablesLayerName);
        const signObject = interactLayer?.objects.find(obj => obj.name === "Sign");

        if (signObject) {
            this.spawnSign(signObject);
        }
    }

    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.introTitleOverlay.update(deltaT);
    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "Sign") {
            this.startDialogue(dialogueWithChoice(
                [
                    "The sign is half-buried in windblown sand.",
                    "<red>Warning: desert centipedes hunt beyond this point.",
                    "Keep moving. If the ground starts shaking, run.",
                    "Begin the final journey?"
                ],
                {
                    lineIndex: 3,
                    options: [
                        choiceOption(
                            "Yes",
                            dialogue(
                                ["You take a breath and step into the burning road."],
                                { onComplete: () => this.gotoDesertLandParallax() }
                            )
                        ),
                        choiceOption(
                            "No",
                            dialogue(["You step back from the sign. Not yet."])
                        )
                    ]
                }
            ));
            return;
        }

        if (obj.name === "Cave") {
            this.startDialogue(dialogue([
                "The cave waits behind you, dark and still.",
                "Fairyland is close now.",
                "We should move forward."
            ]));
            return;
        }

        this.tryStartInteractionDialogue(obj);
    }

    private gotoDesertLandParallax(): void {
        this.sceneManager.changeToScene(
            DesertLandParallaxScene,
            {
                cheatsEnabled: this.cheatsEnabled,
                spawnName: "RoadStart"
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

    private showIntroTitle(): void {
        this.introTitleOverlay.showTitle(
            this.introTitleText,
            this.introTitleDurationSeconds,
            "white"
        );
    }

    private spawnSign(signObject: TiledObject): void {
        const sign = this.add.sprite(
            this.assets.sprites.signSprite.key,
            this.interactablesLayerName
        );
    
        sign.scale.set(this.signScale, this.signScale);
    
        sign.position.set(
            signObject.x + signObject.width / 2,
            signObject.y + signObject.height - sign.size.y * this.signScale / 2
        );
    
        sign.setSortTile(this.getObjectTile(signObject));
        sign.setSortOrder(1);
    }
    
}
