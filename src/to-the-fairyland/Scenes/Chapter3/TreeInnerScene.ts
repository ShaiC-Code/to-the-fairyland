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
import VineAttackController, { type VineSwordCutCapsule, VineAttackOptions } from "../../AI/NPC/NPCController/VineAttackController";
import VineShooterWaveController, { VINE_INDICATOR_LAYER_NAME } from "../../AI/NPC/NPCController/VineShooterWaveController";
import TitleOverlay from "../../Overlays/TitleOverlay";
import { AssetBundle, ChapterSceneDefinition } from "../MappedAdventureScene";
import AudioController from "../../GameSystems/AudioController";
import Debug from "../../../Wolfie2D/Debug/Debug";
import Color from "../../../Wolfie2D/Utils/Color";
import type { PlayerAttackHitbox } from "../../GameSystems/CombatSystem/PlayerAttackController";
import AmbienceController from "../../GameSystems/WorldSystem/AmbienceController";

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
            vineAttackSFX: { key: "vine-attack", path: "/assets/sounds/vine-attack.ogg" }
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
    private readonly vineHurtDamage = 5;
    private readonly vineHurtRadius = 22;
    private readonly vineHurtCenterOffset = new Vec2(0, 34);
    private readonly vineHurtCooldown = 0.75;
    private readonly showVineHurtDebug = false;
    private readonly excaliburAttackCapsuleDebugDuration = 0.5;
    private debugExcaliburAttackCapsule: VineSwordCutCapsule | null = null;
    private debugExcaliburAttackCapsuleTimer = 0;
    private readonly vineTrapPairs: ReadonlyArray<readonly [string, string]> = [
        ["1_L", "1_R"],
        ["2_L", "2_R"],
        ["3_L", "3_R"]
    ];

    private vineExitCollisionTemplate!: OrthogonalTilemap;
    private readonly vineExitCollisionLayerName = "VineExitCollisions";
    private vineExitCloseCutsceneActive = false;
    private vineExitClosePending = false;
    
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

        this.updateExcaliburAttackCapsuleDebug(deltaT);
        this.vineWaveTitleOverlay.update(deltaT);
        this.syncTreeInnerInputLock();
    }

    public override render(): void {
        super.render();

        if (!this.showVineHurtDebug || !this.player) {
            return;
        }

        Debug.drawCircle(
            this.player.inRelativeCoordinates(this.getVineHurtCenter()),
            this.vineHurtRadius * this.getViewScale(),
            false,
            new Color(255, 0, 0, 0.9)
        );
        this.drawExcaliburAttackCapsuleDebug();
    }

    protected override updateGameplay(deltaT: number): void {
        if (this.isVineWaveTitlePauseActive()) {
            return;
        }

        super.updateGameplay(deltaT);
        this.checkVineTrapTriggers();
        this.vineShooterWaveController.update(deltaT);
        this.updateExcaliburPull(deltaT);
        this.vineAttackController.update(deltaT);
        this.updateVinePlayerDamage();
    }

    protected override canPlayerAttack(): boolean {
        return !this.shouldHoldTreeInnerInputLock();
    }

    protected override handlePlayerAttackHitbox(hitbox: PlayerAttackHitbox): void {
        this.captureExcaliburAttackCapsuleDebug(hitbox);
        super.handlePlayerAttackHitbox(hitbox);
    }

    private updateExcaliburAttackCapsuleDebug(deltaT: number): void {
        if (this.debugExcaliburAttackCapsuleTimer <= 0) {
            return;
        }

        this.debugExcaliburAttackCapsuleTimer = Math.max(
            0,
            this.debugExcaliburAttackCapsuleTimer - deltaT
        );

        if (this.debugExcaliburAttackCapsuleTimer === 0) {
            this.debugExcaliburAttackCapsule = null;
        }
    }

    private captureExcaliburAttackCapsuleDebug(hitbox: PlayerAttackHitbox): void {
        if (!this.showVineHurtDebug) {
            return;
        }

        this.debugExcaliburAttackCapsule = this.vineAttackController.getSwordCutCapsule(hitbox);
        this.debugExcaliburAttackCapsuleTimer = this.excaliburAttackCapsuleDebugDuration;
    }

    private drawExcaliburAttackCapsuleDebug(): void {
        if (this.debugExcaliburAttackCapsuleTimer <= 0 || !this.debugExcaliburAttackCapsule) {
            return;
        }

        const capsule = this.debugExcaliburAttackCapsule;
        const viewScale = this.getViewScale();
        const color = new Color(0, 255, 255, 0.9);
        const radius = capsule.radius * viewScale;
        const distance = capsule.start.distanceTo(capsule.end);
        const sampleCount = Math.max(1, Math.ceil(distance / Math.max(capsule.radius, 1)));

        Debug.drawRay(
            this.player.inRelativeCoordinates(capsule.start),
            this.player.inRelativeCoordinates(capsule.end),
            color
        );

        for (let i = 0; i <= sampleCount; i++) {
            const t = i / sampleCount;
            Debug.drawCircle(
                this.player.inRelativeCoordinates(Vec2.lerp(capsule.start, capsule.end, t)),
                radius,
                false,
                color
            );
        }
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
        this.syncExcaliburStoryState();

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
            waitSeconds: seconds => this.waitSimulationSeconds(seconds),
            showWaveTitle: (text, duration) => this.showVineWaveTitle(text, duration),
            getTilesCrossedByWorldSegment: (start, end) => this.vineAttackController.getTilesCrossedByWorldSegment(start, end),
            startVineAttack: (startObj, endObj, options) => {
                AudioController.getInstance().playSound(this.assets.sounds.vineAttackSFX.key);
                this.vineAttackController.startFromObjects(startObj, endObj, options)
            },
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
        return this.hasExcalibur()
            || this.storyManager.chapter3.hasReachedStep(Chapter3MainQuestStep.EXCALIBUR_PULLED);
    }

    private syncExcaliburStoryState(): void {
        if (!this.hasExcalibur()) {
            return;
        }

        const step = this.storyManager.chapter3.getMainQuestStep();
        const shouldRepairStory =
            step === Chapter3MainQuestStep.HEALED_BY_TOOTH_FAIRY
            || step === Chapter3MainQuestStep.NEED_EXCALIBUR;

        this.storyManager.chapter3.markNeedExcalibur();
        this.storyManager.chapter3.markExcaliburPulled();

        if (shouldRepairStory) {
            this.gameSessionManager.saveCurrentSession();
        }
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
            if (this.storyManager.chapter3.canTriggerVineExitClose()) {
                this.startVineExitCloseSequenceWhenReady();
                return;
            }

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
        this.gameSessionManager.saveCurrentSession();
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

    private hasExcalibur(): boolean {
        return this.playerStateManager.getPlayerState().inventory.find(item => item instanceof Excalibur) !== null;
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

    private waitSimulationSeconds(seconds: number): Promise<void> {
        return new Promise(resolve => {
            new Timer(seconds * 1000, resolve).start();
        });
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
            || this.vineExitClosePending
            || this.isVineWaveTitlePauseActive();
    }

    private isVineWaveTitlePauseActive(): boolean {
        return this.vineWaveTitleOverlay?.shouldPauseWorld() ?? false;
    }

    private updateVinePlayerDamage(): void {
        if (this.player.health <= 0) {
            return;
        }

        if (this.playerAttackController.isAttacking()) {
            return;
        }

        if (!this.vineAttackController.currentVinesIntersectCircle(this.getVineHurtCenter(), this.vineHurtRadius)) {
            return;
        }

        this.damagePlayer(this.vineHurtDamage, {
            cooldownSeconds: this.vineHurtCooldown,
            source: "vine"
        });
    }

    private getVineHurtCenter(): Vec2 {
        return this.player.position.clone().add(this.vineHurtCenterOffset);
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
        this.startVineExitCloseSequenceWhenReady();
    }

    private startVineExitCloseSequenceWhenReady(): void {
        if (!this.storyManager.chapter3.canTriggerVineExitClose()) {
            return;
        }

        this.transitioning = false;

        if (this.vineExitCloseCutsceneActive || this.vineExitClosePending) {
            return;
        }

        this.vineExitClosePending = true;

        const ai = this.player.ai as PlayerAI;
    
        if (ai.moving) {
            const previousOnMoveComplete = ai.onMoveComplete;
            ai.onMoveComplete = () => {
                previousOnMoveComplete?.();
                this.lockPlayerInput();
                new Timer(0, () => void this.activateVineTrap()).start();
            };
            return;
        }

        void this.activateVineTrap();
    }

    private async activateVineTrap(): Promise<void> {
        if (this.vineExitCloseCutsceneActive) {
            this.vineExitClosePending = false;
            return;
        }
    
        this.vineExitClosePending = false;
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
    
    protected override playCurrentAmbience(): void {
        AmbienceController.getInstance().stopAmbience(this.ambienceChannel);
        AmbienceController.getInstance().stopAmbience(this.fairyAmbienceChannel);
    }
}
