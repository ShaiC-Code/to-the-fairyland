import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestSceneBase from "../ForestSceneBase";
import DeeperForestScene from "./DeeperForestScene";
import TreeInnerScene from "./TreeInnerScene";
import { AssetBundle } from "../MappedAdventureScene";
import VineAttackController from "../../AI/NPC/NPCController/VineAttackController";
import { choiceOption, dialogue, dialogueWithChoice } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import Excalibur from "../../GameSystems/ItemSystem/Items/Excalibur";
import MainMenu from "../MainMenu";
import AudioController from "../../GameSystems/AudioController";

export default class GreatTreeScene extends ForestSceneBase {
    protected readonly tilemap = {
        key: "greatTree",
        path: "/assets/tilemaps/Chapter4/GreatTree.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            vinePartExitSprite: { key: "vinePartExit", path: "/assets/sprites/VinePartExit.png" }
        },
        sounds: {},
        images: {}
    };
    
    private vineGateController!: VineAttackController;
    private vineGateObject: TiledObject | null = null;
    private vineGateOpened = false;
    private readonly vineGatePoints: Map<string, TiledObject> = new Map();
    private readonly vineGateLayerName = "VineGateVines";
    private readonly vineGatePointLayerName = "VineExit";
    private readonly vineGateCollisionTileId = 1;
    private readonly vineGatePairs: ReadonlyArray<readonly [string, string]> = [
        ["1_L", "1_R"],
        ["2_L", "2_R"]
    ];

    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), GreatTreeScene.assetBundle);
    }

    protected override configureLayers(): void {
        super.configureLayers();
        this.addLayer(this.vineGateLayerName, this.actorLayerDepth + 2);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);

        this.vineGateController = new VineAttackController({
            scene: this,
            ground: this.ground,
            collision: this.collision,
            layerName: this.vineGateLayerName,
            defaultSpriteKey: this.assets.sprites.vinePartExitSprite.key,
            swordAttackHitSFXKey: this.assets.sounds.swordAttackHitSFX.key
        });

        const interactLayer = tilemapData.layers.find(layer => layer.name === this.interactablesLayerName);
        this.vineGateObject = interactLayer?.objects.find(obj => obj.name === "VineGate") ?? null;
        this.vineGatePoints.clear();

        const vineGatePointLayer = tilemapData.layers.find(layer => layer.name === this.vineGatePointLayerName);

        for (const point of vineGatePointLayer?.objects ?? []) {
            this.vineGatePoints.set(point.name, point);
        }

        this.closeVineGate();
    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "VineGate") {
            this.handleVineGateInteraction();
            return;
        }

        this.tryStartInteractionDialogue(obj);
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToDeeperForest") {
            this.changeToForestSection(DeeperForestScene, "RoadEnd");
        }
        else if (obj.name === "PathToTreeInner") {
            this.changeToForestSection(TreeInnerScene, "TreeInner");
        }
        else if (obj.name === "PathToCrowland") {
            this.sceneManager.changeToScene(
                MainMenu,
                {},
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

    private handleVineGateInteraction(): void {
        if (this.vineGateOpened) {
            return;
        }

        if (!this.hasExcalibur()) {
            this.startDialogue(dialogue([
                "Needs something sharp to cut this..."
            ]));
            return;
        }

        this.startDialogue(dialogueWithChoice(
            [
                "The vines are too thick to pass.",
                "Cut this with Excalibur?"
            ],
            {
                lineIndex: 1,
                options: [
                    choiceOption(
                        "Yes",
                        dialogue(
                            ["You cut through the vines."],
                            { onComplete: () => this.openVineGate() }
                        )
                    ),
                    choiceOption(
                        "No",
                        dialogue(["You leave the vines alone."])
                    )
                ]
            }
        ));
    }

    private closeVineGate(): void {
        if (this.vineGateOpened) {
            return;
        }

        this.applyVineGateCollision();

        for (const [startName, endName] of this.vineGatePairs) {
            const startObj = this.vineGatePoints.get(startName);
            const endObj = this.vineGatePoints.get(endName);

            if (!startObj || !endObj) {
                continue;
            }

            this.vineGateController.startCompleteFromObjects(startObj, endObj, {
                type: "exit",
                spriteKey: this.assets.sprites.vinePartExitSprite.key
            });
        }
    }

    private applyVineGateCollision(): void {
        if (!this.vineGateObject) {
            return;
        }

        for (const tile of this.getTilesCoveredByObject(this.vineGateObject)) {
            this.collision.setTile(tile.x, tile.y, this.vineGateCollisionTileId);
        }
    }

    private openVineGate(): void {
        if (this.vineGateOpened) {
            return;
        }

        AudioController.getInstance().playSFX(this.assets.sounds.swordCutSFX.key);
        this.vineGateOpened = true;
        this.clearVineGateCollision();
        this.vineGateController.destroyMatching(attack => attack.type === "exit");
        this.interactables = this.interactables.filter(obj => obj !== this.vineGateObject);
        this.vineGateObject = null;
    }

    private clearVineGateCollision(): void {
        if (!this.vineGateObject) {
            return;
        }

        for (const tile of this.getTilesCoveredByObject(this.vineGateObject)) {
            this.collision.setTile(tile.x, tile.y, 0);
        }
    }

    private hasExcalibur(): boolean {
        return this.playerStateManager.getPlayerState().inventory.find(item => item instanceof Excalibur) !== null;
    }
}
