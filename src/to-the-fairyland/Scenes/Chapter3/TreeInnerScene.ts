import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestSceneBase from "./ForestSceneBase";
import GreatTreeScene from "./GreatTreeScene";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Timer from "../../../Wolfie2D/Timing/Timer";
import { dialogue, DialogueCompleteActions } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import Excalibur from "../../GameSystems/ItemSystem/Items/Excalibur";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import PlayerAI from "../../AI/Player/PlayerAI";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import { Chapter3MainQuestStep } from "../../GameSystems/StorySystem/StoryState";
import VineAttackController, { VineAttackOptions } from "../../AI/NPC/NPCController/VineAttackController";
import VineShooterWaveController, { VINE_INDICATOR_LAYER_NAME } from "../../AI/NPC/NPCController/VineShooterWaveController";
import TitleOverlay from "../../Overlays/TitleOverlay";
import { AssetBundle, ChapterSceneDefinition } from "../MappedAdventureScene";
import AudioController from "../../GameSystems/AudioController";

export default class TreeInnerScene extends ForestSceneBase {
    protected readonly tilemap = {
        key: "treeInner",
        path: "/assets/tilemaps/Chapter3/TreeInner.json"
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
        sounds: {
            swordPullSFX: { key: "sword-pull", path: "/assets/sounds/sword-pull.ogg" },
            excaliburReceivedSFX: { key: "excalibur-received", path: "/assets/sounds/excalibur-received.ogg" },
        },
        images: {}
    };

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
    private vineExitCloseCutsceneActive = false;
    
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
            () => this.viewport.getHalfSize(),
            {
                pauseScene: true
            }
        );

    }
    
    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);

        if (!this.isVineWaveTitlePauseActive()) {
            this.checkVineTrapTriggers();
            this.vineShooterWaveController.update(deltaT);
        }

        if (!this.isVineWaveTitlePauseActive()) {
            this.updateExcaliburPull(deltaT);
            this.vineAttackController.update(deltaT);
        }

        this.vineWaveTitleOverlay.update(deltaT);
        this.syncTreeInnerInputLock();
    }

    protected override canPlayerAttack(): boolean {
        return !this.shouldHoldTreeInnerInputLock();
    }
    
    protected override readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {
            [DialogueCompleteActions.PULL_EXCALIBUR]: () => {
                new Timer(0, () => this.beginPullExcalibur()).start();
            }
        },
        dialogueChoiceActionHandlers: {}
    };
    
    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);

        this.vineAttackController = new VineAttackController({
            scene: this,
            ground: this.ground,
            collision: this.collision,
            layerName: this.vineLayerName,
            defaultSpriteKey: this.assets.sprites.vinePartSprite.key,
            swordAttackHitSFXKey: this.assets.sounds.swordAttackHitSFX.key
        });

        this.swordHitDispatcher.register(this.vineAttackController);

        this.vineShooterWaveController = new VineShooterWaveController({
            scene: this,
            ground: this.ground,
            getPlayerAI: () => this.player.ai as PlayerAI,
            shouldRun: () => this.storyManager.chapter3.getMainQuestStep() === Chapter3MainQuestStep.VINE_EXIT_CLOSED,
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

        if (this.storyManager.chapter3.isVineExitClosed()) {
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
        this.storyManager.chapter3.markVineExitOpened();
        this.clearVineExitCollision();
        this.vineAttackController.destroyMatching(attack => attack.type === "exit");
        AudioController.getInstance().stopMusic(5);
    }

    private hasExcaliburBeenPulled(): boolean {
        return this.storyManager.chapter3.hasReachedStep(Chapter3MainQuestStep.EXCALIBUR_PULLED);
    }

    private closeVineExit(): void {
        this.applyVineExitCollision();
        this.storyManager.chapter3.markVineExitClosed();
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
        this.tryStartInteractionDialogue(obj);
    }    


    private beginPullExcalibur(): void {
        if (this.pullingExcalibur || !this.excaliburSprite) {
            return;
        }

        AudioController.getInstance().playSFX(this.assets.sounds.swordPullSFX.key);
    
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
        this.storyManager.chapter3.markExcaliburPulled();
        this.unlockPlayerInput();
    
        this.startDialogue(dialogue([
            "<yellow>[You obtained Excalibur]",
            "Press X/K to attack"
        ]));
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
            this.playExcaliburReceivedSFX();
        }
    }

    protected playExcaliburReceivedSFX(): void {
        AudioController.getInstance().playSFX(this.assets.sounds.excaliburReceivedSFX.key);
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
        this.lockPlayerInput();

        await this.vineWaveTitleOverlay.showTitle(text, duration);

        if (!this.shouldHoldTreeInnerInputLock()) {
            this.unlockPlayerInput();
        }
    }

    private syncTreeInnerInputLock(): void {
        if (this.shouldHoldTreeInnerInputLock()) {
            this.lockPlayerInput();
        }
    }

    private shouldHoldTreeInnerInputLock(): boolean {
        return this.pullingExcalibur
            || this.vineExitCloseCutsceneActive
            || this.isVineWaveTitlePauseActive();
    }

    private isVineWaveTitlePauseActive(): boolean {
        return this.vineWaveTitleOverlay?.getIsVisible() ?? false;
    }

    private findVineTrapAtTile(tile: Vec2 | null): TiledObject | undefined {
        if (!tile) {
            return undefined;
        }

        return this.vineTrapTiles.get(this.tileKey(tile));
    }

    protected override getScenePlayerAttackDashStopTileIndex(
        tiles: Vec2[],
        _originTile: Vec2,
        _direction: Vec2
    ): number {
        if (!this.storyManager.chapter3.canTriggerVineExitClose()) {
            return -1;
        }

        if (this.vineExitCloseCutsceneActive) {
            return -1;
        }

        return tiles.findIndex(tile => this.findVineTrapAtTile(tile));
    }

    private checkVineTrapTriggers(): void {
        if (!this.storyManager.chapter3.canTriggerVineExitClose()) {
            return;
        }

        if (this.vineExitCloseCutsceneActive) {
            return;
        }

        if (this.playerAttackController.isAttacking()) {
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
        if (this.vineExitCloseCutsceneActive) {
            return;
        }
    
        this.vineExitCloseCutsceneActive = true;
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
        this.vineExitCloseCutsceneActive = false;

        this.startDialogue(
            dialogue(["The Vines blocked the way out..."],
            {
                onComplete: () => {
                    AudioController.getInstance().playMusic(this.assets.sounds.battleTreeMusic.key, true, true, 3);
                }
            })
        );
    }

    private tileKey(tile: Vec2): string {
        return `${tile.x},${tile.y}`;
    }
    
}
