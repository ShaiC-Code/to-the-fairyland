import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import MappedAdventureScene, {
    AssetBundle,
    ChapterSceneDefinition
} from "../MappedAdventureScene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import BubbleParticleBehavior, { BubbleParticleSettings } from "../../AI/BubbleParticleBehavior";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import DolphinPathBehavior from "../../AI/NPC/NPCBehavior/DolphinPathBehavior";
import AmbienceController from "../../GameSystems/WorldSystem/AmbienceController";
import { AudioChannelType } from "../../../Wolfie2D/Sound/AudioManager";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import TitleOverlay from "../../Overlays/TitleOverlay";
import { dialogue } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import UndergroundCaveScene from "./UndergroundCaveScene";

export default class EmeraldPondScene extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "emeraldPond",
        path: "/assets/tilemaps/Chapter7/EmeraldPond.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {
            emeraldPond: {
                key: "emeraldPond",
                path: "/assets/tilemaps/Chapter7/EmeraldPond.json"
            }
        },
        spritesheets: {
            playerSheet: {
                key: "fateDrown",
                path: "/assets/spritesheets/FateDrown.json"
            },
            dolphinSheet: {
                key: "dolphin",
                path: "/assets/spritesheets/Dolphin.json"
            }
        },
        sprites: {
            pondDepth: {
                key: "pondDepth",
                path: "/assets/sprites/overlays/ponddepth.png"
            },
            bubble1: { key: "bubble1", path: "/assets/sprites/particles/Bubble1.png" },
            bubble2: { key: "bubble2", path: "/assets/sprites/particles/Bubble2.png" },
            bubble3: { key: "bubble3", path: "/assets/sprites/particles/Bubble3.png" },
            fairyParticle2: { key: "fairyParticle2", path: "/assets/sprites/particles/FairyParticle2.png" }

        },
        sounds: {
            underwaterAmbienceSFX: { key: "ambience-underwater", path: "/assets/sounds/ambience-underwater.ogg" }
        },
        images: {}
    };
    
    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {},
        dialogueChoiceActionHandlers: {}
    };

    private readonly bubbleBackLayerName = "BubblesBack";
    private readonly bubbleFrontLayerName = "BubblesFront";
    private readonly bubblePoolSize = 12;
    private readonly bubbleSpawnIntervalMin = 0.035;
    private readonly bubbleSpawnIntervalMax = 0.075;
    private readonly drownFlowDepthThreshold = 0;

    private bubbleBurstRemaining = 0;
    private bubbleBurstPauseTimer = 0;

    private readonly bubbleBurstSizeMin = 4;
    private readonly bubbleBurstSizeMax = 9;
    private readonly bubbleBurstPauseMin = 0.25;
    private readonly bubbleBurstPauseMax = 0.75;
    
    private readonly dolphinPathLayerName = "DolphinPath";
    private readonly dolphinSpawnName = "Dolphin";
    private readonly dolphinMoveDuration = 0.2;
    private readonly storyManager = StoryManager.getInstance();
    private readonly fishRevealDelaySeconds = 7;
    private readonly fishRevealQuietSeconds = 2;
    private readonly fishRevealTitleDurationSeconds = 2.5;
    private readonly fishRevealDolphinDelaySeconds = 1;
    private readonly fishRevealTitleLayerName = "FishRevealTitleOverlay";
    private readonly rescueCompleteFadeOutMs = 2000;
    private readonly undergroundCaveSpawnName = "CaveInner";
    private readonly dolphinParticleLayerName = "DolphinFairyParticles";
    private readonly dolphinCinematicZoomLevel = 0.88;
    private readonly dolphinCinematicZoomDurationSeconds = 5;

    private dolphin: AnimatedSprite | null = null;
    private fishRevealTitleOverlay!: TitleOverlay;
    private fishRevealTimer = 0;
    private fishRevealSequenceStarted = false;
    private sceneActive = false;

    private bubbles: Sprite[] = [];
    private bubbleSpawnTimer = 0;
    private bubbleFlowStarted = false;

    private readonly bubbleSettings: BubbleParticleSettings = {
        lifetimeMin: 1.1,
        lifetimeMax: 2.2,
        fadeInSeconds: 0.18,
        fadeOutSeconds: 0.45,
        riseSpeedMin: 35,
        riseSpeedMax: 85,
        fanSpeedMin: 4,
        fanSpeedMax: 22,
        fanAccelerationMin: 8,
        fanAccelerationMax: 32,
        wobbleAmplitudeMin: 4,
        wobbleAmplitudeMax: 14,
        wobbleFrequencyMin: 4,
        wobbleFrequencyMax: 9,
        scaleMin: 0.35,
        scaleMax: 0.75,
        scaleGrowth: 0.25
    };

    protected override playIdleForFacing(_facing: Vec2): void {
        this.player.animation.play("Drown", true);
    }

    private readonly pondDepthLayerName = "PondDepth";
    private pondDepthBackground!: Sprite;
    private pondDepthStartY = 0;

    private currentDepth = 0;
    private readonly sinkSpeed = 30;

    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), EmeraldPondScene.assetBundle);
    }

    // =============== Start Scene =======================
    public override startScene(): void {
        this.spawnName = "Fate";
        this.sceneActive = true;
        this.fishRevealTimer = 0;
        this.fishRevealSequenceStarted = false;
        this.dolphin = null;
        super.startScene();

        this.player.position.y += 25;

        this.lockPlayerInput();
        this.setupPondDepthBackground();
        this.setupBubblePool();
        if (this.shouldShowDolphin()) {
            this.setupDolphinIfNeeded();
        }
        AmbienceController.getInstance().playAmbience(this.ambienceChannel, this.assets.sounds.underwaterAmbienceSFX.key);
    }

    protected override configureLayers(): void {
        super.configureLayers();
        this.addLayer(this.dolphinParticleLayerName, this.actorLayerDepth + 0.5);
        this.fishRevealTitleOverlay = new TitleOverlay(
            this.fishRevealTitleLayerName,
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            {
                fontSize: 54,
                pauseScene: true
            }
        );
    }

    public override unloadScene(): void {
        this.sceneActive = false;
        this.cameraController.zoomTo(1, 0);
        super.unloadScene();
        AmbienceController.getInstance().stopAllAmbience();
    }

    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.fishRevealTitleOverlay.update(deltaT);
    }

    // =============== Update Scene =======================
    protected override updateGameplay(deltaT: number): void {
        super.updateGameplay(deltaT);

        this.currentDepth += this.sinkSpeed * deltaT;
        this.pondDepthBackground.position.y = this.pondDepthStartY - this.currentDepth;
        if (!this.bubbleFlowStarted && this.currentDepth >= this.drownFlowDepthThreshold) {
            this.bubbleFlowStarted = true;
            this.player.animation.playIfNotAlready("DrownFlow", true);
        }
        this.updateBubbleSpawning(deltaT);

        if (!this.dialogueController.isActive) {
            this.updateFishRevealSequence(deltaT);
        }
    }

    private updateFishRevealSequence(deltaT: number): void {
        if (
            this.gameSessionManager.getStoryState().chapter4 === undefined
            || this.fishRevealSequenceStarted
            || this.dolphin
            || this.shouldShowDolphin()
        ) {
            return;
        }

        this.fishRevealTimer += deltaT;
        if (this.fishRevealTimer < this.fishRevealDelaySeconds) {
            return;
        }

        this.startFishRevealSequence();
    }

    private startFishRevealSequence(): void {
        if (this.fishRevealSequenceStarted) {
            return;
        }

        this.fishRevealSequenceStarted = true;
        this.startDialogue(
            dialogue(
                [
                    "Is this it?",
                    "Will I die like this?",
                    "No one will even know where I sank."
                ],
                { onComplete: () => { 
                    this.lockPlayerInput(); this.finishFishRevealSequence();
                }}
            ),
            undefined,
            { layoutMode: "topRightQuarter" }
        );
    }

    private async finishFishRevealSequence(): Promise<void> {
        await this.waitSeconds(this.fishRevealQuietSeconds);
        if (!this.sceneActive || this.transitioning) {
            return;
        }

        await this.fishRevealTitleOverlay.showTitle(
            "Something is approaching!",
            this.fishRevealTitleDurationSeconds,
            "red"
        );

        if (!this.sceneActive || this.transitioning) {
            return;
        }

        await this.waitSeconds(this.fishRevealDolphinDelaySeconds);
        if (!this.sceneActive || this.transitioning) {
            return;
        }

        this.storyManager.chapter4.markFishAppeared();
        this.gameSessionManager.saveCurrentSession();
        this.setupDolphinIfNeeded();
    }

    private shouldShowDolphin(): boolean {
        return this.gameSessionManager.getStoryState().chapter4 !== undefined
            && this.storyManager.chapter4.canShowEmeraldPondFish();
    }

    private setupDolphinIfNeeded(): void {
        if (this.dolphin) {
            return;
        }

        this.setupDolphin();
    }

    private setupDolphin(): void {
        const tilemapData = this.resourceManager.getTilemap(this.tilemap.key) as TiledTilemapData;
    
        const spawnLayer = tilemapData.layers.find(layer => layer.name === this.spawnLayerName);
        const dolphinSpawn = spawnLayer?.objects?.find(obj => obj.name === this.dolphinSpawnName);
    
        const pathLayer = tilemapData.layers.find(layer => layer.name === this.dolphinPathLayerName);
    
        if (!dolphinSpawn) {
            throw new Error(`Missing Dolphin spawn point in ${this.spawnLayerName}`);
        }
    
        const dolphinPathWaypoints = (pathLayer?.objects ?? [])
            .filter(obj => !Number.isNaN(Number(obj.name)))
            .sort((a, b) => Number(a.name) - Number(b.name))
            .map(obj => ({
                tile: this.getObjectTile(obj),
                facing: this.getFacingFromObject(obj),
                facingHoldSeconds: this.getFacingHoldSecondsFromObject(obj),
                action: this.getActionFromObject(obj)
            }));

        const dolphinStartTile = this.getObjectTile(dolphinSpawn);
    
        this.dolphin = this.add.animatedSprite(
            AnimatedSprite,
            this.assets.spritesheets.dolphinSheet.key,
            this.actorLayerName
        );
        
        this.dolphin.setSortOrder(1);
    
        this.dolphin.position.copy(
            this.ground.getTileCenter(dolphinStartTile.x, dolphinStartTile.y)
        );
        this.dolphin.animation.play("IDLE_LEFT", true);
        this.dolphin.addAI(DolphinPathBehavior, {
            ground: this.ground,
            collision: this.collision,
            startTile: dolphinStartTile,
            pathWaypoints: dolphinPathWaypoints,
            moveDuration: this.dolphinMoveDuration,
            player: this.player,
            particleSpriteKey: this.assets.sprites.fairyParticle2.key,
            particleLayerName: this.dolphinParticleLayerName,
            onPlayerGrabbed: () => this.holdCameraForDolphinRescue(),
            onRescueComplete: () => this.transitionToUndergroundCave()
        });
        this.startDolphinCinematicCamera();
    }

    private startDolphinCinematicCamera(): void {
        this.cameraController.holdAtCurrentViewCenter();
        this.cameraController.expandBoundsToFullMap();
        this.cameraController.zoomTo(
            this.dolphinCinematicZoomLevel,
            this.dolphinCinematicZoomDurationSeconds
        );
    }

    private holdCameraForDolphinRescue(): void {
        this.cameraController.holdAtCurrentViewCenter();
    }

    private getActionFromObject(obj: TiledObject): string | undefined {
        return obj.properties?.find(prop => prop.name === "action")?.value;
    }
    

    private getFacingFromObject(obj: TiledObject): Vec2 | undefined {
        const facing = obj.properties?.find(prop => prop.name === "facing")?.value;

        if (facing === "up") return Vec2.UP;
        if (facing === "down") return Vec2.DOWN;
        if (facing === "left") return Vec2.LEFT;
        if (facing === "right") return Vec2.RIGHT;

        return undefined;
    }

    private getFacingHoldSecondsFromObject(obj: TiledObject): number {
        const value = obj.properties?.find(prop => prop.name === "time_of_facing")?.value;
        const seconds = Number(value);

        return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    }
    
    private setupPondDepthBackground(): void {
        this.addLayer(this.pondDepthLayerName, 0);
    
        this.pondDepthBackground = this.add.sprite(
            this.assets.sprites.pondDepth.key,
            this.pondDepthLayerName
        );
    
        const mapWidth = this.ground.size.x * this.ground.scale.x;
        const mapHeight = this.ground.size.y * this.ground.scale.y;
    
        const mapCenterX = this.ground.position.x;
        const mapTopY = this.ground.position.y - mapHeight / 2;
    
        const scaleX = mapWidth / this.pondDepthBackground.size.x;
    
        this.pondDepthBackground.scale.set(
            scaleX,
            1
        );
    
        this.pondDepthBackground.position.set(
            mapCenterX,
            mapTopY + this.pondDepthBackground.size.y / 2
        );
    
        this.pondDepthStartY = this.pondDepthBackground.position.y;
    }
    private setupBubblePool(): void {
        this.addLayer(this.bubbleBackLayerName, this.actorLayerDepth - 1);
        this.addLayer(this.bubbleFrontLayerName, this.actorLayerDepth + 1);
    
        const bubbleKeys = [
            this.assets.sprites.bubble1.key,
            this.assets.sprites.bubble2.key,
            this.assets.sprites.bubble3.key
        ];
    
        for (let i = 0; i < this.bubblePoolSize; i++) {
            const layerName =
                Math.random() < 0.55
                    ? this.bubbleBackLayerName
                    : this.bubbleFrontLayerName;
    
            const bubble = this.add.sprite(
                bubbleKeys[i % bubbleKeys.length],
                layerName
            );
    
            bubble.visible = false;
            bubble.alpha = 0;
            bubble.addAI(BubbleParticleBehavior, {
                settings: this.bubbleSettings
            });
    
            this.bubbles.push(bubble);
        }
    }
    
    
    private updateBubbleSpawning(deltaT: number): void {
        if (!this.bubbleFlowStarted) {
            return;
        }
    
        if (this.bubbleBurstRemaining <= 0) {
            this.bubbleBurstPauseTimer -= deltaT;
    
            if (this.bubbleBurstPauseTimer > 0) {
                return;
            }
    
            this.bubbleBurstRemaining = Math.floor(
                this.randomBetween(this.bubbleBurstSizeMin, this.bubbleBurstSizeMax + 1)
            );
    
            this.bubbleBurstPauseTimer = this.randomBetween(
                this.bubbleBurstPauseMin,
                this.bubbleBurstPauseMax
            );
        }
    
        this.bubbleSpawnTimer -= deltaT;
    
        while (this.bubbleSpawnTimer <= 0 && this.bubbleBurstRemaining > 0) {
            this.spawnBubbleFromPlayerTile();
            this.bubbleBurstRemaining--;
    
            this.bubbleSpawnTimer += this.randomBetween(
                this.bubbleSpawnIntervalMin,
                this.bubbleSpawnIntervalMax
            );
        }
    }
    
    
    
    private spawnBubbleFromPlayerTile(): void {
        const bubble = this.bubbles.find(candidate => !candidate.visible);
        if (!bubble) {
            return;
        }
    
        const tileSize = this.ground.getScaledTileSize();

        const bubbleSpawnOffsetY = -20;
        const bubbleOrigin = this.player.position.clone();
        bubbleOrigin.y += bubbleSpawnOffsetY;

        const isBackBubble = bubble.getLayer().getName() === this.bubbleBackLayerName;
        // scale variation
        const scaleMultiplier = isBackBubble
            ? this.randomBetween(0.45, 0.75)
            : this.randomBetween(0.85, 1.25);
        // alpha variation
        const maxAlpha = isBackBubble
            ? this.randomBetween(0.25, 0.55)
            : this.randomBetween(0.65, 1.0);
    
        const bubbleAI = bubble.ai as BubbleParticleBehavior;
        bubbleAI.activate({
            origin: bubbleOrigin,
            tileSize,
            settings: this.bubbleSettings,
            scaleMultiplier,
            maxAlpha
        });
    }
    
    private randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
    
    private transitionToUndergroundCave(): void {
        if (this.transitioning) {
            return;
        }
    
        this.transitioning = true;
        if (this.gameSessionManager.getStoryState().chapter4) {
            this.storyManager.chapter4.markEnteredUndergroundCave();
        }
        this.gameSessionManager.setResumePoint(
            "UndergroundCaveScene",
            this.undergroundCaveSpawnName,
            this.cheatsEnabled
        );
        this.gameSessionManager.saveCurrentSession();
    
        this.sceneManager.changeToScene(
            UndergroundCaveScene,
            {
                cheatsEnabled: this.cheatsEnabled,
                spawnName: this.undergroundCaveSpawnName
            },
            undefined,
            {
                showLoadingOverlay: true,
                useFadeTransition: true,
                fadeOutMs: this.rescueCompleteFadeOutMs,
                fadeInMs: 500
            }
        );
    }
    
}
