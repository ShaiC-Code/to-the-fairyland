import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import { AssetBundle } from "../MappedAdventureScene";
import ForestSceneBase from "../ForestSceneBase";
import GreatTreeScene from "./GreatTreeScene";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Timer from "../../../Wolfie2D/Timing/Timer";
import { choiceOption, dialogue, dialogueWithChoice } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import Excalibur from "../../GameSystems/ItemSystem/Items/Excalibur";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import PlayerAI from "../../AI/Player/PlayerAI";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import { Chapter4MainQuestStep } from "../../GameSystems/StorySystem/StoryState";
import VineAttackController, { VineAttackOptions } from "./TreeInner/VineAttackController";
import VineShooterWaveController, { VINE_INDICATOR_LAYER_NAME } from "./TreeInner/VineShooterWaveController";
import TitleOverlay from "../../Overlays/TitleOverlay";


export default class TreeInnerScene extends ForestSceneBase {
    private readonly storyManager = StoryManager.getInstance();

    private excaliburSprite: Sprite | null = null;
    private excaliburObject: TiledObject | null = null;
    private pullingExcalibur = false;
    private excaliburPullElapsed = 0;
    private excaliburStartY = 0;

    private readonly excaliburPullDuration = 1.5;
    private readonly excaliburFadeDuration = 0.45;
    private readonly excaliburPullDistance = 96;

    private vineExitPoints: Map<string, TiledObject> = new Map();
    private vineTrapObjects: TiledObject[] = [];
    private vineTrapTiles: Map<string, TiledObject> = new Map();
    private triggeredVineTraps: Set<string> = new Set();

    private vineAttackController!: VineAttackController;
    private vineShooterWaveController!: VineShooterWaveController;
    private vineWaveTitleOverlay!: TitleOverlay;

    private readonly vineLayerName = "VineShooters";
    private readonly vineWaveTitleLayerName = "VineWaveTitleOverlay";
    private readonly vineExitSpeed = 400;
    private readonly vineTrapPairs: ReadonlyArray<readonly [string, string]> = [
        ["1_L", "1_R"],
        ["2_L", "2_R"],
        ["3_L", "3_R"]
    ];

    private vineExitCollisionTemplate!: OrthogonalTilemap;
    private readonly vineExitCollisionLayerName = "VineExitCollisions";
    private vineExitClosing = false;


    protected readonly tilemap = {
        key: "treeInner",
        path: "/assets/tilemaps/Chapter4/TreeInner.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            excaliburSprite: { key: "excalibur", path: "/assets/sprites/Excalibur.png" },
            trunkFrontSprite: { key: "trunkFront", path: "/assets/sprites/TrunkFront.png" },
            vinePartSprite: { key: "vinePart", path: "/assets/sprites/VinePart.png" },
            vinePartExitSprite: { key: "vinePartExit", path: "/assets/sprites/VinePartExit.png" }
        },
        sounds: {}
    };
    
    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), TreeInnerScene.assetBundle);
    }

    public override startScene(): void {
        super.startScene();

        if (this.hasExcaliburBeenPulled()) {
            this.removeExcaliburInteractable();
        }
    }
    
    protected override configureLayers(): void {
        this.getLayer("Ground").setDepth(2);
        this.getLayer("TrunkBack").setDepth(8);
        this.getLayer("TrunkFront").setDepth(this.actorLayerDepth);
        this.getLayer("Interactables").setDepth(this.actorLayerDepth);
        this.addLayer(VINE_INDICATOR_LAYER_NAME, this.actorLayerDepth + 1);
        this.getLayer("VineShooters").setDepth(this.actorLayerDepth + 2);
        this.vineWaveTitleOverlay = new TitleOverlay(
            this.vineWaveTitleLayerName,
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize()
        );

    }
    
    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.checkVineTrapTriggers();
        this.vineShooterWaveController.update(deltaT);
        this.updateExcaliburPull(deltaT);
        this.vineAttackController.update(deltaT);
        this.vineWaveTitleOverlay.update(deltaT);
    }
    
    
    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);

        this.vineAttackController = new VineAttackController({
            scene: this,
            ground: this.ground,
            collision: this.collision,
            layerName: this.vineLayerName,
            defaultSpriteKey: this.assets.sprites.vinePartSprite.key
        });

        this.swordHitDispatcher.register(this.vineAttackController);

        this.vineShooterWaveController = new VineShooterWaveController({
            scene: this,
            ground: this.ground,
            getPlayerAI: () => this.player.ai as PlayerAI,
            shouldRun: () => this.storyManager.chapter4.getMainQuestStep() === Chapter4MainQuestStep.VINE_EXIT_CLOSED,
            isDialogueActive: () => this.dialogueController.isActive,
            waitSeconds: seconds => this.waitSeconds(seconds),
            showWaveTitle: (text, duration) => this.showVineWaveTitle(text, duration),
            getTilesCrossedByWorldSegment: (start, end) => this.vineAttackController.getTilesCrossedByWorldSegment(start, end),
            startVineAttack: (startObj, endObj, options) => this.vineAttackController.startFromObjects(startObj, endObj, options),
            vineSpriteKey: this.assets.sprites.vinePartSprite.key,
            indicatorStyle: "line",
            onAllWavesComplete: () => this.openVineExit()

        });

        this.vineExitCollisionTemplate = this.getRequiredTilemap(this.vineExitCollisionLayerName);
        this.vineExitCollisionTemplate.visible = false;

        if (this.storyManager.chapter4.isVineExitClosed()) {
            this.applyVineExitCollision();
        }
    
        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables");
        const excaliburPoint = interactLayer?.objects.find(obj => obj.name === "Excalibur");
    
        if (excaliburPoint && !this.hasExcaliburBeenPulled()) {
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

        const vineExitLayer = tilemapData.layers.find(layer => layer.name === "VineExit");
        this.vineExitPoints.clear();

        for (const point of vineExitLayer?.objects ?? []) {
            this.vineExitPoints.set(point.name, point);
        }

        const vineShooterLayer = tilemapData.layers.find(layer => layer.name === this.vineLayerName);
        this.vineShooterWaveController.setVineShooterPoints(vineShooterLayer?.objects ?? []);

        const triggerLayer = tilemapData.layers.find(layer => layer.name === "Triggers");
        this.vineTrapObjects = triggerLayer?.objects.filter(obj => obj.name === "VineTrap") ?? [];
        this.vineTrapTiles.clear();

        for (const trap of this.vineTrapObjects) {
            for (const tile of this.getTilesCoveredByObject(trap)) {
                this.vineTrapTiles.set(this.tileKey(tile), trap);
            }
        }
    }

    private openVineExit(): void {
        this.storyManager.chapter4.markVineExitOpened();
        this.clearVineExitCollision();
        this.vineAttackController.destroyMatching(attack => attack.type === "exit");
    }

    private hasExcaliburBeenPulled(): boolean {
        return this.storyManager.chapter4.hasReachedStep(Chapter4MainQuestStep.EXCALIBUR_PULLED);
    }

    private closeVineExit(): void {
        this.applyVineExitCollision();
        this.storyManager.chapter4.markVineExitClosed();
    }
    

    private applyVineExitCollision(): void {
        this.forEachVineExitCollisionTile((col, row, tile) => {
            this.collision.setTile(col, row, tile);
        });
    }

    private clearVineExitCollision(): void {
        this.forEachVineExitCollisionTile((col, row) => {
            this.collision.setTile(col, row, 0);
        });
    }

    private forEachVineExitCollisionTile(callback: (col: number, row: number, tile: number) => void): void {
        const size = this.vineExitCollisionTemplate.getDimensions();
    
        for (let row = 0; row < size.y; row++) {
            for (let col = 0; col < size.x; col++) {
                const tile = this.vineExitCollisionTemplate.getTile(col, row);
    
                if (tile === 0) {
                    continue;
                }
    
                callback(col, row, tile);
            }
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
        this.storyManager.chapter4.markExcaliburPulled();
        this.unlockPlayerInput();
    
        this.startDialogue(dialogue(["<yellow>[You obtained Excalibur]"]));
    }
    
    // remove excalibur from scene after given to player
    private removeExcaliburInteractable(): void {
        this.interactables = this.interactables.filter(obj =>
            obj !== this.excaliburObject && obj.name !== "Excalibur"
        );
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
    
    private startVineAttack(startName: string, endName: string, options: VineAttackOptions = {}): void {
        const startObj = this.vineExitPoints.get(startName);
        const endObj = this.vineExitPoints.get(endName);
    
        if (!startObj || !endObj) {
            return;
        }

        this.vineAttackController.startFromObjects(startObj, endObj, options);
    }

    private async showVineWaveTitle(text: string, duration: number): Promise<void> {
        this.vineWaveTitleOverlay.showTitle(text);
        this.lockPlayerInput();

        await this.waitSeconds(duration);

        this.vineWaveTitleOverlay.hide();
        this.unlockPlayerInput();
    }

    private findVineTrapAtTile(tile: Vec2 | null): TiledObject | undefined {
        if (!tile) {
            return undefined;
        }

        return this.vineTrapTiles.get(this.tileKey(tile));
    }

    private checkVineTrapTriggers(): void {
        if (!this.storyManager.chapter4.canTriggerVineExitClose()) {
            return;
        }

        if (this.vineExitClosing) {
            return;
        }

        const ai = this.player.ai as PlayerAI;
        const trap = this.findVineTrapAtTile(ai.targetTile) ?? this.findVineTrapAtTile(ai.currentTile);

        if (!trap) {
            return;
        }

        const trapKey = `${trap.name}:${trap.x},${trap.y}`;

        if (this.triggeredVineTraps.has(trapKey)) {
            return;
        }

        this.triggeredVineTraps.add(trapKey);

        if (ai.moving) {
            const previousOnMoveComplete = ai.onMoveComplete;
            ai.onMoveComplete = () => {
                previousOnMoveComplete?.();
                this.lockPlayerInput();
                new Timer(0, () => this.activateVineTrap()).start();
            };
            return;
        }

        this.activateVineTrap();
    }

    private async activateVineTrap(): Promise<void> {
        if (this.vineExitClosing) {
            return;
        }
    
        this.vineExitClosing = true;
        this.lockPlayerInput();
    
        for (const [startName, endName] of this.vineTrapPairs) {
            this.startVineAttack(startName, endName, {
                type: "exit",
                speed: this.vineExitSpeed,
                spriteKey: this.assets.sprites.vinePartExitSprite.key
            });
        }
    
        await this.movePlayerOneTileBackwardAsync({ ignoreCollision: true });
    
        this.closeVineExit();
        this.vineShooterWaveController.setCooldown(this.vineShooterWaveController.getInitialCooldown());

        this.startDialogue(dialogue([
            "The Vines blocked the way out..."
        ]));
    }

    private tileKey(tile: Vec2): string {
        return `${tile.x},${tile.y}`;
    }
    
}
