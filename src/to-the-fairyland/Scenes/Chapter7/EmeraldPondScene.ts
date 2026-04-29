import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import MappedAdventureScene, {
    AssetBundle,
    ChapterSceneDefinition
} from "../MappedAdventureScene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import PlayerAI from "../../AI/Player/PlayerAI";
import BubbleParticleBehavior, { BubbleParticleSettings } from "../../AI/BubbleParticleBehavior";


export default class EmeraldPondScene extends MappedAdventureScene {

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
            }
        },
        sprites: {
            pondDepth: {
                key: "pondDepth",
                path: "/assets/sprites/overlays/ponddepth.png"
            },
            bubble1: { key: "bubble1", path: "/assets/sprites/particles/Bubble1.png" },
            bubble2: { key: "bubble2", path: "/assets/sprites/particles/Bubble2.png" },
            bubble3: { key: "bubble3", path: "/assets/sprites/particles/Bubble3.png" }

        },
        sounds: {}
    };
    
    protected override playIdleForFacing(_facing: Vec2): void {
        this.player.animation.play("Drown", true);
    }    
    

    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {},
        dialogueChoiceActionHandlers: {}
    };

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
        super.startScene();

        this.player.position.y += 25;

        this.lockPlayerInput();
        this.setupPondDepthBackground();
        this.setupBubblePool();
    }

    // =============== Update Scene =======================
    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);

        if (this.worldPaused || this.dialogueController.isActive) {
            return;
        }

        this.currentDepth += this.sinkSpeed * deltaT;
        this.pondDepthBackground.position.y = this.pondDepthStartY - this.currentDepth;
        if (!this.bubbleFlowStarted && this.currentDepth >= this.drownFlowDepthThreshold) {
            this.bubbleFlowStarted = true;
            this.player.animation.playIfNotAlready("DrownFlow", true);
        }
        this.updateBubbleSpawning(deltaT);
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
    
        const ai = this.player.ai as PlayerAI;
        const tileCenter = this.ground.getTileCenter(ai.currentTile.x, ai.currentTile.y);
        const tileSize = this.ground.getScaledTileSize();

        const bubbleSpawnOffsetY = -20;
        const bubbleOrigin = tileCenter.clone();
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
    

}
