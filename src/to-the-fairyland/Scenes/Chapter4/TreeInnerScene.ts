import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import { AssetBundle } from "../MappedAdventureScene";
import ForestSceneBase from "../ForestSceneBase";
import GreatTreeScene from "./GreatTreeScene";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Timer from "../../../Wolfie2D/Timing/Timer";
import { choiceOption, dialogue, dialogueWithChoice } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import Excalibur from "../../GameSystems/ItemSystem/Items/Excalibur";

export default class TreeInner extends ForestSceneBase {
    private excaliburSprite: Sprite | null = null;
    private excaliburObject: TiledObject | null = null;
    private pullingExcalibur = false;
    private excaliburPullElapsed = 0;
    private excaliburStartY = 0;

    private readonly excaliburPullDuration = 1.5;
    private readonly excaliburFadeDuration = 0.45;
    private readonly excaliburPullDistance = 96;

    protected readonly tilemap = {
        key: "treeInner",
        path: "/assets/tilemaps/Chapter4/TreeInner.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            excaliburSprite: { key: "excalibur", path: "/assets/sprites/Excalibur.png" },
            trunkFrontSprite: { key: "trunkFront", path: "/assets/sprites/TrunkFront.png" }
        },
        sounds: {}
    };
    
    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), TreeInner.assetBundle);
    }
    
    protected override configureLayers(): void {
        this.getLayer("Ground").setDepth(2);
        this.getLayer("TrunkBack").setDepth(8);
        this.getLayer("Interactables").setDepth(this.actorLayerDepth);
        this.getLayer("TrunkFront").setDepth(this.actorLayerDepth);
    }
    
    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.updateExcaliburPull(deltaT);
    }
    
    
    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);
    
        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables");
        const excaliburPoint = interactLayer?.objects.find(obj => obj.name === "Excalibur");
    
        if (excaliburPoint) {
            const excalibur = this.add.sprite(
                this.assets.sprites.excaliburSprite.key,
                "Interactables"
            );
    
            excalibur.position.set(
                excaliburPoint.x,
                excaliburPoint.y - 10
            );
    
            excalibur.setSortTile(this.ground.getTilemapPosition(excaliburPoint.x, excaliburPoint.y));
            excalibur.setSortOrder(1);

            this.excaliburSprite = excalibur;
            this.excaliburObject = excaliburPoint;
            excalibur.alpha = 1;
        }
        
    
        const trunkFrontLayer = tilemapData.layers.find(layer => layer.name === "TrunkFront");
        const trunkFrontPoint = trunkFrontLayer?.objects.find(obj => obj.name === "TrunkFront");
    
        if (trunkFrontPoint) {
            const trunkFront = this.add.sprite(
                this.assets.sprites.trunkFrontSprite.key,
                "TrunkFront"
            );
    
            trunkFront.position.set(
                trunkFrontPoint.x,
                trunkFrontPoint.y + 30
            );
    
            trunkFront.setSortTile(this.ground.getTilemapPosition(trunkFrontPoint.x, trunkFrontPoint.y));
            trunkFront.setSortOrder(2);
        }
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToGreatTree") {
            this.changeToForestSection(GreatTreeScene, "TreeOuter");
        }
    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "Excalibur") {
            this.startDialogue(
                dialogueWithChoice(
                    [
                        "A sword is buried in the trunk.",
                        "Pull out Excalibur?"
                    ],
                    {
                        lineIndex: 1,
                        options: [
                            choiceOption(
                                "Yes",
                                dialogue(
                                    ["You grip the hilt tightly."],
                                    {
                                        onComplete: () => {
                                            new Timer(0, () => this.beginPullExcalibur()).start();
                                        }
                                    }
                                )
                            ),
                            choiceOption(
                                "No",
                                dialogue(["You leave the sword where it is."])
                            )
                        ]
                    }
                )
            );
            return;
        }
    
        this.tryStartInteractionDialogue(obj);
    }


    private beginPullExcalibur(): void {
        if (this.pullingExcalibur || !this.excaliburSprite) {
            return;
        }
    
        this.pullingExcalibur = true;
        this.excaliburPullElapsed = 0;
        this.excaliburStartY = this.excaliburSprite.position.y;
    
        this.removeExcaliburInteractable();
        this.lockPlayerInput();
    }
    
    private updateExcaliburPull(deltaT: number): void {
        if (!this.pullingExcalibur || !this.excaliburSprite) {
            return;
        }
    
        this.excaliburPullElapsed += deltaT;
    
        const pullT = Math.min(this.excaliburPullElapsed / this.excaliburPullDuration, 1);
        const easedPull = Math.sin((pullT * Math.PI) / 2);
    
        this.excaliburSprite.position.y =
            this.excaliburStartY - this.excaliburPullDistance * easedPull;
    
        if (pullT > 0.25) {
            this.excaliburSprite.setSortOrder(3);
        }
    
        if (pullT < 1) {
            return;
        }
    
        const fadeElapsed = this.excaliburPullElapsed - this.excaliburPullDuration;
        const fadeT = Math.min(fadeElapsed / this.excaliburFadeDuration, 1);
    
        this.excaliburSprite.alpha = 1 - fadeT;
    
        if (fadeT >= 1) {
            this.finishPullExcalibur();
        }
    }
    
    // called when pull animation finishes
    private finishPullExcalibur(): void {
        this.pullingExcalibur = false;
    
        this.excaliburSprite?.destroy();
        this.excaliburSprite = null;
    
        this.giveExcalibur();
        this.unlockPlayerInput();
    
        this.startDialogue(dialogue(["<yellow>[You obtained Excalibur]"]));
    }
    
    // remove excalibur from scene after given to player
    private removeExcaliburInteractable(): void {
        if (!this.excaliburObject) {
            return;
        }
    
        this.interactables = this.interactables.filter(obj => obj !== this.excaliburObject);
        this.excaliburObject = null;
    }
    
    // give excalibur to the user inventory
    private giveExcalibur(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasExcalibur = inventory.find(item => item instanceof Excalibur) !== null;
    
        if (alreadyHasExcalibur) {
            return;
        }
    
        const addedItem = inventory.add(new Excalibur());
    
        if (addedItem !== null) {
            this.playItemReceivedSFX();
        }
    }
    
    
}