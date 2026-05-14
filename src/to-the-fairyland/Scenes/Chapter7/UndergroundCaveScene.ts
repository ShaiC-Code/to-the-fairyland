import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import { TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Rect from "../../../Wolfie2D/Nodes/Graphics/Rect";
import { GraphicType } from "../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Color from "../../../Wolfie2D/Utils/Color";
import FairyParticleBehavior, {
    defaultFairyParticleSettings,
    FairyParticleSettings
} from "../../AI/FairyParticleBehavior";
import PlayerAI from "../../AI/Player/PlayerAI";
import { PlayerControlMode } from "../../AI/Player/PlayerController";
import { dialogue } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import CreditsScene from "../CreditsScene";
import TitleOverlay from "../../Overlays/TitleOverlay";
import { CustomUIElementType } from "../../UI/CustomUIElements/CustomUIElementTypes";
import ClickableOverlay from "../../UI/CustomUIElements/ClickableOverlay";
import MappedAdventureScene, {
    AssetBundle,
    ChapterSceneDefinition
} from "../MappedAdventureScene";
import AudioController from "../../GameSystems/AudioController";
import AmbienceController from "../../GameSystems/WorldSystem/AmbienceController";

type CaveFairyFinaleState = "drifting" | "dashing" | "absorbed";
type FairyCinematicPhase = "reveal" | "gather" | "title";

type CaveFairy = {
    sprite: AnimatedSprite;
    glow: Sprite;
    origin: Vec2;
    velocity: Vec2;
    age: number;
    fadeInSeconds: number;
    bobAmplitude: number;
    bobFrequency: number;
    bobPhase: number;
    glowBaseScale: number;
    glowPulseScale: number;
    glowAlphaMin: number;
    glowAlphaMax: number;
    glowFrequency: number;
    glowPhase: number;
    finaleState: CaveFairyFinaleState;
    dashStart: Vec2;
    dashTargetOffset: Vec2;
    dashElapsed: number;
    dashDuration: number;
    dashTrailTimer: number;
};

type CaveFairyShine = {
    sprite: Sprite;
    age: number;
    lifetime: number;
    startScale: number;
    endScale: number;
    maxAlpha: number;
};

export default class UndergroundCaveScene extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "undergroundCave",
        path: "/assets/tilemaps/Chapter7/UndergroundCave.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {
            playerSheet: {
                key: "fateDrown",
                path: "/assets/spritesheets/FateDrown.json"
            },
            dolphinSheet: {
                key: "dolphin",
                path: "/assets/spritesheets/Dolphin.json"
            },
            fairySheet: {
                key: "fairy",
                path: "/assets/spritesheets/Fairy.json"
            }
        },
        sprites: {
            caveBush: {
                key: "caveBush",
                path: "/assets/sprites/CaveBush.png"
            },
            fairyParticle2: {
                key: "fairyParticle2",
                path: "/assets/sprites/particles/FairyParticle2.png"
            },
            fairyParticle3: {
                key: "fairyParticle3",
                path: "/assets/sprites/particles/FairyParticle3.png"
            }
        },
        sounds: {
            fairiesSpawningSFX: {
                key: "fairies-spawning",
                path: "/assets/sounds/fairies-spawning.ogg"
            },
            fairiesAbsorbingSFX: {
                key: "fairies-absorbing",
                path: "/assets/sounds/fairies-absorbing.ogg"
            },
            caveAmbienceSFX: {
                key: "ambience-cave",
                path: "/assets/sounds/ambience-cave.ogg"
            }
        },
        images: {}
    };

    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {},
        dialogueChoiceActionHandlers: {}
    };

    private readonly caveSpawnName = "CaveInner";
    private readonly dolphinSpawnName = "Dolphin";
    private readonly bushesLayerName = "Bushes";
    private readonly caveBushFeetOffsetY = 20;
    private readonly dolphinParticleLayerName = "DolphinFairyParticles";
    private readonly dolphinParticlePoolSize = 36;
    private readonly dolphinParticleSpawnSpread = 14;
    private readonly dolphinParticleEmitIntervalMin = 0.025;
    private readonly dolphinParticleEmitIntervalMax = 0.06;
    private readonly dolphinParticleSettings: FairyParticleSettings = defaultFairyParticleSettings;
    private readonly caveDarknessLayerName = "CaveDarkness";
    private readonly caveFinalLightLayerName = "CaveFinalLight";
    private readonly finalTitleLayerName = "FinalTitleOverlay";
    private readonly caveFairyShineLayerName = "CaveFairyShines";
    private readonly caveFairyLayerName = "CaveFairies";
    private readonly caveFairyParticleLayerName = "CaveFairyParticles";
    private readonly caveDarknessStartAlpha = 0.68;
    private readonly caveDarknessEndAlpha = 0.24;
    private readonly caveDarknessFadeEasePower = 1.65;
    private readonly caveIntroDialogueDelaySeconds = 4;
    private readonly introFirstFairyDialogueLineIndex = 4;
    private readonly fairyRevealStartDelaySeconds = 0;
    private readonly fairyRevealDurationSeconds = 28;
    private readonly fairyRevealSpawnAcceleration = 4;
    private readonly fairyRevealZoomLevel = 0.72;
    private readonly fairyRevealZoomDurationSeconds = this.fairyRevealDurationSeconds;
    private readonly fairyGatherStartDelaySeconds = 0.55;
    private readonly fairyGatherDurationSeconds = 7.5;
    private readonly fairyGatherDashCompleteProgress = 0.86;
    private readonly fairyGatherAcceleration = 3.4;
    private readonly fairyDashDurationMin = 0.42;
    private readonly fairyDashDurationMax = 1.05;
    private readonly fairyDashTargetSpreadX = 18;
    private readonly fairyDashTargetSpreadY = 28;
    private readonly fairyDashGlowScaleMin = 1.15;
    private readonly fairyDashGlowScaleMax = 2.35;
    private readonly fairyDashTrailEmitIntervalMin = 0.025;
    private readonly fairyDashTrailEmitIntervalMax = 0.055;
    private readonly fairyDashTrailSpawnSpread = 4;
    private readonly caveFinalLightMaxAlpha = 1;
    private readonly caveFinalLightStartProgress = 0.48;
    private readonly caveFinalLightEasePower = 2.15;
    private readonly finalTitleFadeInSeconds = 2;
    private readonly finalTitleAutoProceedSeconds = 7;
    private readonly finalMainMenuFadeOutMs = 900;
    private readonly finalMainMenuFadeInMs = 900;
    private readonly maxCaveFairies = 180;
    private readonly fairyViewportPaddingRatio = 0.08;
    private readonly fairyGlowBaseScaleMin = 2;
    private readonly fairyGlowBaseScaleMax = 3.35;
    private readonly fairyGlowPulseScaleMin = 0.55;
    private readonly fairyGlowPulseScaleMax = 1.45;
    private readonly fairyGlowAlphaMin = 0.10;
    private readonly fairyGlowAlphaMax = 0.55;
    private readonly fairyGlowFrequencyMin = 1.2;
    private readonly fairyGlowFrequencyMax = 2.8;
    private readonly fairyShinePoolSize = 64;
    private readonly fairyShineLifetimeSeconds = 0.78;
    private readonly fairyParticlePoolSize = 420;
    private readonly fairyParticlesPerSpawn = 10;
    private readonly fairyParticleSpawnSpread = 32;
    private readonly fairyParticleSettings: FairyParticleSettings = {
        ...defaultFairyParticleSettings,
        lifetimeMin: 0.85,
        lifetimeMax: 1.45,
        startScaleMin: 0.35,
        startScaleMax: 0.85,
        endScaleMin: 0.06,
        endScaleMax: 0.18,
        alphaMin: 0.50,
        alphaMax: 1,
        trailSpeedMin: 8,
        trailSpeedMax: 34,
        riseSpeedMin: 12,
        riseSpeedMax: 46,
        sidewaysSpeedMin: -46,
        sidewaysSpeedMax: 46,
        shineAlphaPulse: 0.30,
        shineScalePulse: 0.12
    };
    private readonly fairyDashTrailSettings: FairyParticleSettings = {
        ...defaultFairyParticleSettings,
        lifetimeMin: 0.28,
        lifetimeMax: 0.52,
        fadeInSeconds: 0.02,
        fadeOutSeconds: 0.28,
        startScaleMin: 0.16,
        startScaleMax: 0.34,
        endScaleMin: 0.03,
        endScaleMax: 0.08,
        alphaMin: 0.72,
        alphaMax: 1,
        trailSpeedMin: 34,
        trailSpeedMax: 82,
        riseSpeedMin: 0,
        riseSpeedMax: 8,
        sidewaysSpeedMin: -14,
        sidewaysSpeedMax: 14,
        damping: 1.8,
        wobbleAmplitudeMin: 0,
        wobbleAmplitudeMax: 3,
        wobbleFrequencyMin: 5,
        wobbleFrequencyMax: 10,
        shineAlphaPulse: 0.38,
        shineScalePulse: 0.10
    };

    private dolphin: AnimatedSprite | null = null;
    private dolphinParticles: Sprite[] = [];
    private dolphinParticleEmitTimer = 0;
    private caveDarkness!: Rect;
    private caveFinalLight!: Rect;
    private finalTitleOverlay!: TitleOverlay;
    private finalTitleClickOverlay!: ClickableOverlay;
    private caveFairies: CaveFairy[] = [];
    private fairyShines: CaveFairyShine[] = [];
    private fairyParticles: Sprite[] = [];
    private fairyRevealElapsed = 0;
    private fairyGatherElapsed = 0;
    private fairyCinematicPhase: FairyCinematicPhase = "reveal";
    private fairyRevealStarted = false;
    private finalTitleShown = false;
    private finalTitleAutoProceedElapsed = 0;
    private introFairySpawned = false;
    private caveIntroDialogueDelayRemaining = 0;
    private caveIntroDialogueStarted = false;
    private sceneActive = false;

    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), UndergroundCaveScene.assetBundle);
    }

    public override loadScene(): void {
        super.loadScene();

        this.add.registerCustomUIElement(CustomUIElementType.CLICKABLE_OVERLAY, (options?: Record<string, any>) => {
            return new ClickableOverlay(options!.position);
        });
    }

    protected override configureLayers(): void {
        this.getLayer(this.bushesLayerName).setDepth(this.actorLayerDepth);
        this.getLayer(this.groundLayerName).setDepth(2);
        this.addLayer(this.dolphinParticleLayerName, this.actorLayerDepth + 0.5);
        this.addParallaxLayer(this.caveDarknessLayerName, Vec2.ZERO, this.actorLayerDepth + 0.65);
        this.addLayer(this.caveFairyShineLayerName, this.actorLayerDepth + 0.8);
        this.addLayer(this.caveFairyLayerName, this.actorLayerDepth + 0.9);
        this.addLayer(this.caveFairyParticleLayerName, this.actorLayerDepth + 1);
        this.addParallaxLayer(this.caveFinalLightLayerName, Vec2.ZERO, this.actorLayerDepth + 1.25);
        this.finalTitleOverlay = new TitleOverlay(
            this.finalTitleLayerName,
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            {
                backgroundColor: Color.WHITE,
                defaultTextColor: "black",
                fontSize: 76,
                titleHeight: 150,
                pauseScene: true,
                pauseDuringTransition: true,
                fadeInSeconds: this.finalTitleFadeInSeconds,
                fadeOutSeconds: 0
            }
        );

        const viewportHalfSize = this.viewport.getHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        this.finalTitleClickOverlay = this.add.uiElement(CustomUIElementType.CLICKABLE_OVERLAY, this.finalTitleLayerName, {
            position: viewportHalfSize.clone()
        }) as ClickableOverlay;
        this.finalTitleClickOverlay.size.set(viewportSize.x, viewportSize.y);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        this.spawnCaveBushes(tilemapData);
        this.spawnDolphin(tilemapData);
    }

    protected override playIdleForFacing(_facing: Vec2): void {
        this.player.animation.play("Drown", true);
    }

    public override startScene(): void {
        this.spawnName = this.spawnName ?? this.caveSpawnName;
        this.sceneActive = true;
        super.startScene();
        this.player.position.y += 25;
        this.putPlayerInDrownMode();
        this.setupCaveDarkness();
        this.setupCaveFinalLight();
        this.setupFairyIntro();
        this.caveIntroDialogueDelayRemaining = this.caveIntroDialogueDelaySeconds;

        AmbienceController.getInstance().playAmbience(this.ambienceChannel, this.assets.sounds.caveAmbienceSFX.key);
    }

    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.finalTitleOverlay.update(deltaT);

        if (this.finalTitleOverlay.getIsVisible()) {
            this.finalTitleAutoProceedElapsed += deltaT;
            if (this.finalTitleAutoProceedElapsed >= this.finalTitleAutoProceedSeconds) {
                this.proceedFromFinalTitle();
            }
        }
    }

    public override unloadScene(): void {
        this.sceneActive = false;
        this.cameraController.zoomTo(1, 0);
        this.viewport.setZoomLevel(1);
        super.unloadScene();
    }

    protected override canPlayerAttack(): boolean {
        return false;
    }

    protected override updateGameplay(deltaT: number): void {
        super.updateGameplay(deltaT);
        this.updateDolphinParticleEmission(deltaT);
        this.updateCaveDarkness();
        this.updateCaveFinalLight();
        this.updateCaveIntroDialogueDelay(deltaT);
        this.updateFairyCinematic(deltaT);
    }

    private putPlayerInDrownMode(): void {
        const ai = this.player.ai as PlayerAI;

        ai.targetTile = null;
        ai.moving = false;
        ai.moveProgress = 0;
        ai.moveStart = this.player.position.clone();
        ai.moveEnd = this.player.position.clone();
        ai.controller.setControlMode(PlayerControlMode.FAINTED);

        this.player.animation.play("Drown", true);
    }

    private spawnCaveBushes(tilemapData: TiledTilemapData): void {
        const bushLayer = tilemapData.layers.find(layer => layer.name === this.bushesLayerName);
        const bushPoints = bushLayer?.objects ?? [];

        for (const point of bushPoints) {
            const bush = this.add.sprite(this.assets.sprites.caveBush.key, this.bushesLayerName);
            bush.position.set(
                point.x,
                point.y - bush.size.y / 2 + this.caveBushFeetOffsetY
            );
            bush.setSortTile(this.ground.getTilemapPosition(point.x, point.y));
            bush.setSortOrder(1);
        }
    }

    private spawnDolphin(tilemapData: TiledTilemapData): void {
        const spawnLayer = tilemapData.layers.find(layer => layer.name === this.spawnLayerName);
        const dolphinSpawn = spawnLayer?.objects?.find(obj => obj.name === this.dolphinSpawnName);

        if (!dolphinSpawn) {
            return;
        }

        const dolphinStartTile = this.getObjectTile(dolphinSpawn);
        this.dolphin = this.add.animatedSprite(
            AnimatedSprite,
            this.assets.spritesheets.dolphinSheet.key,
            this.actorLayerName
        );

        this.dolphin.position.copy(
            this.ground.getTileCenter(dolphinStartTile.x, dolphinStartTile.y)
        );
        this.dolphin.setSortTile(dolphinStartTile);
        this.dolphin.setSortOrder(1);
        this.dolphin.animation.play(this.getDolphinIdleAnimation(dolphinSpawn), true);
        this.setupDolphinParticlePool();
    }

    private getDolphinIdleAnimation(spawn: { properties?: Array<{ name: string; value: unknown }> }): string {
        const facing = spawn.properties?.find(prop => prop.name === "facing")?.value;

        if (facing === "down") return "IDLE_DOWN";
        if (facing === "left") return "IDLE_LEFT";
        if (facing === "right") return "IDLE_RIGHT";

        return "IDLE_UP";
    }

    private setupDolphinParticlePool(): void {
        if (this.dolphinParticles.length > 0) {
            return;
        }

        for (let i = 0; i < this.dolphinParticlePoolSize; i++) {
            const particle = this.add.sprite(
                this.assets.sprites.fairyParticle2.key,
                this.dolphinParticleLayerName
            );

            particle.visible = false;
            particle.alpha = 0;
            particle.addAI(FairyParticleBehavior, {
                settings: this.dolphinParticleSettings
            });

            this.dolphinParticles.push(particle);
        }
    }

    private updateDolphinParticleEmission(deltaT: number): void {
        if (!this.dolphin || this.dolphinParticles.length === 0) {
            return;
        }

        this.dolphinParticleEmitTimer -= deltaT;

        while (this.dolphinParticleEmitTimer <= 0) {
            this.emitDolphinParticle();
            this.dolphinParticleEmitTimer += this.randomBetween(
                this.dolphinParticleEmitIntervalMin,
                this.dolphinParticleEmitIntervalMax
            );
        }
    }

    private emitDolphinParticle(): void {
        const particle = this.dolphinParticles.find(candidate => !candidate.visible);

        if (!particle || !this.dolphin) {
            return;
        }

        const particleAI = particle.ai as FairyParticleBehavior;
        particleAI.activate({
            origin: this.dolphin.position.clone(),
            sourceVelocity: Vec2.ZERO,
            spawnSpread: this.dolphinParticleSpawnSpread,
            settings: this.dolphinParticleSettings
        });
    }

    private setupCaveDarkness(): void {
        const viewportHalfSize = this.viewport.getHalfSize();

        this.caveDarkness = this.add.graphic(GraphicType.RECT, this.caveDarknessLayerName, {
            position: viewportHalfSize.clone(),
            size: viewportHalfSize.clone().scale(2)
        }) as Rect;
        this.caveDarkness.color = Color.BLACK;
        this.caveDarkness.alpha = this.caveDarknessStartAlpha;
    }

    private updateCaveDarkness(): void {
        if (!this.caveDarkness) {
            return;
        }

        const viewportHalfSize = this.viewport.getHalfSize();
        this.caveDarkness.position.copy(viewportHalfSize);
        this.caveDarkness.size.copy(viewportHalfSize.clone().scale(2));
        this.caveDarkness.alpha = this.getCurrentCaveDarknessAlpha();
    }

    private setupCaveFinalLight(): void {
        const viewportHalfSize = this.viewport.getHalfSize();

        this.caveFinalLight = this.add.graphic(GraphicType.RECT, this.caveFinalLightLayerName, {
            position: viewportHalfSize.clone(),
            size: viewportHalfSize.clone().scale(2)
        }) as Rect;
        this.caveFinalLight.color = Color.WHITE;
        this.caveFinalLight.alpha = 0;
    }

    private updateCaveFinalLight(): void {
        if (!this.caveFinalLight) {
            return;
        }

        const viewportHalfSize = this.viewport.getHalfSize();
        this.caveFinalLight.position.copy(viewportHalfSize);
        this.caveFinalLight.size.copy(viewportHalfSize.clone().scale(2));
        this.caveFinalLight.alpha = this.getCurrentFinalLightAlpha();
    }

    private getCurrentCaveDarknessAlpha(): number {
        if (!this.fairyRevealStarted) {
            return this.caveDarknessStartAlpha;
        }

        if (this.fairyCinematicPhase !== "reveal") {
            return this.lerp(
                this.caveDarknessEndAlpha,
                0,
                this.getFairyGatherLightProgress()
            );
        }

        const progress = Math.pow(
            this.getFairyRevealSpawnProgress(),
            this.caveDarknessFadeEasePower
        );

        return this.lerp(this.caveDarknessStartAlpha, this.caveDarknessEndAlpha, progress);
    }

    private getCurrentFinalLightAlpha(): number {
        if (this.fairyCinematicPhase === "reveal") {
            return 0;
        }

        const progress = Math.pow(
            this.getFairyGatherLightProgress(),
            this.caveFinalLightEasePower
        );

        return this.caveFinalLightMaxAlpha * progress;
    }

    private setupFairyIntro(): void {
        this.fairyRevealElapsed = 0;
        this.fairyGatherElapsed = 0;
        this.fairyCinematicPhase = "reveal";
        this.fairyRevealStarted = false;
        this.finalTitleShown = false;
        this.introFairySpawned = false;
        this.caveIntroDialogueStarted = false;
        this.setupFairyShinePool();
        this.setupFairyParticlePool();
    }

    private updateCaveIntroDialogueDelay(deltaT: number): void {
        if (this.caveIntroDialogueStarted || !this.sceneActive) {
            return;
        }

        this.caveIntroDialogueDelayRemaining -= deltaT;

        if (this.caveIntroDialogueDelayRemaining <= 0) {
            this.caveIntroDialogueStarted = true;
            this.startCaveIntroDialogue();
        }
    }

    private startCaveIntroDialogue(): void {
        this.startDialogue(
            dialogue(
                [
                    "You awake in a dark cave.",
                    "The moisture in the air is suffocating, and the water is oddly still.",
                    "You are unable to move...",
                    "Then, a small light appears.",
                    "Its glow warms you in the depths.",
                    "More lights appear from deeper within the cave."
                ],
                { onComplete: () => {
                    AmbienceController.getInstance().stopAmbience(this.ambienceChannel);
                    this.lockPlayerInput();
                    this.finishCaveIntroDialogue();
                }}
            ),
            undefined,
            {
                layoutMode: "topRightQuarter",
                onLineStart: lineIndex => this.handleCaveIntroDialogueLineStart(lineIndex)
            }
        );
    }

    private handleCaveIntroDialogueLineStart(lineIndex: number): void {
        if (lineIndex !== this.introFirstFairyDialogueLineIndex
            || !this.sceneActive
            || this.introFairySpawned
        ) {
            return;
        }

        this.spawnIntroFairy();
    }

    private finishCaveIntroDialogue(): void {
        if (!this.sceneActive) {
            return;
        }

        if (!this.introFairySpawned) {
            this.spawnIntroFairy();
        }

        this.setupFairyCinematic();
    }

    private spawnIntroFairy(): void {
        this.introFairySpawned = true;
        const introFairy = this.spawnCaveFairy(
            this.getIntroFairySpawnPoint(),
            new Vec2(-3, -1)
        );

        introFairy.glowBaseScale = 3.2;
        introFairy.glowPulseScale = 1.7;
        introFairy.glowAlphaMin = 0.28;
        introFairy.glowAlphaMax = 0.78;
        introFairy.fadeInSeconds = 0.85;
    }

    private getIntroFairySpawnPoint(): Vec2 {
        return new Vec2(
            Math.max(0, Math.min(this.ground.size.x, this.player.position.x + 56)),
            Math.max(0, Math.min(this.ground.size.y, this.player.position.y - 44))
        );
    }

    private setupFairyCinematic(): void {
        this.cameraController.holdAtCurrentViewCenter();
        this.cameraController.expandBoundsToFullMap();
        this.cameraController.zoomTo(this.fairyRevealZoomLevel, this.fairyRevealZoomDurationSeconds);

        this.fairyRevealElapsed = 0;
        this.fairyGatherElapsed = 0;
        this.fairyCinematicPhase = "reveal";
        this.fairyRevealStarted = true;
        this.setupFairyShinePool();
        this.setupFairyParticlePool();
    }

    private updateFairyCinematic(deltaT: number): void {
        this.updateCaveFairies(deltaT);
        this.updateFairyShines(deltaT);

        if (!this.fairyRevealStarted) {
            return;
        }

        if (this.fairyCinematicPhase === "gather") {
            this.updateFairyGatherPhase(deltaT);
            return;
        }

        if (this.fairyCinematicPhase === "title") {
            return;
        }

        this.fairyRevealElapsed += deltaT;

        const targetFairyCount = this.getTargetFairyCountForRevealProgress();

        while (this.caveFairies.length < targetFairyCount) {
            this.spawnCaveFairy();
        }

        if (this.caveFairies.length >= this.maxCaveFairies && this.getFairyRevealSpawnProgress() >= 1) {
            this.startFairyGatherPhase();
        }
    }

    private startFairyGatherPhase(): void {
        this.fairyCinematicPhase = "gather";
        this.fairyGatherElapsed = 0;
        AudioController.getInstance().playSFX(this.assets.sounds.fairiesAbsorbingSFX.key);
    }

    private updateFairyGatherPhase(deltaT: number): void {
        this.fairyGatherElapsed += deltaT;

        const targetDashCount = this.getTargetFairyDashCountForGatherProgress();

        while (this.getStartedFairyDashCount() < targetDashCount) {
            if (!this.startRandomFairyDashToPlayer()) {
                break;
            }
        }

        if (this.getAbsorbedFairyCount() >= this.caveFairies.length
            && this.getFairyGatherLightProgress() >= 1
        ) {
            this.showFinalTitle();
        }
    }

    private spawnCaveFairy(
        position: Vec2 = this.getRandomPointInCameraView(),
        velocity: Vec2 = this.getRandomFairyVelocity()
    ): CaveFairy {
        const glow = this.add.sprite(
            this.assets.sprites.fairyParticle3.key,
            this.caveFairyShineLayerName
        );
        const fairy = this.add.animatedSprite(
            AnimatedSprite,
            this.assets.spritesheets.fairySheet.key,
            this.caveFairyLayerName
        );
        const scale = this.randomBetween(0.75, 1.12);

        glow.position.copy(position);
        glow.scale.set(0, 0);
        glow.alpha = 0;
        glow.visible = true;
        glow.setSortTile(this.ground.getTilemapPosition(position.x, position.y));
        glow.setSortOrder(2);

        fairy.position.copy(position);
        fairy.scale.set(scale, scale);
        fairy.alpha = 0;
        fairy.setSortTile(this.ground.getTilemapPosition(position.x, position.y));
        fairy.setSortOrder(3);
        fairy.animation.play(velocity.x < 0 ? "IDLE_LEFT" : "IDLE_RIGHT", true);

        const caveFairy: CaveFairy = {
            sprite: fairy,
            glow,
            origin: position.clone(),
            velocity,
            age: 0,
            fadeInSeconds: this.randomBetween(0.18, 0.42),
            bobAmplitude: this.randomBetween(6, 18),
            bobFrequency: this.randomBetween(2.2, 5.2),
            bobPhase: Math.random() * Math.PI * 2,
            glowBaseScale: this.randomBetween(this.fairyGlowBaseScaleMin, this.fairyGlowBaseScaleMax),
            glowPulseScale: this.randomBetween(this.fairyGlowPulseScaleMin, this.fairyGlowPulseScaleMax),
            glowAlphaMin: this.randomBetween(this.fairyGlowAlphaMin, this.fairyGlowAlphaMin + 0.08),
            glowAlphaMax: this.randomBetween(this.fairyGlowAlphaMax - 0.18, this.fairyGlowAlphaMax),
            glowFrequency: this.randomBetween(this.fairyGlowFrequencyMin, this.fairyGlowFrequencyMax),
            glowPhase: Math.random() * Math.PI * 2,
            finaleState: "drifting",
            dashStart: position.clone(),
            dashTargetOffset: Vec2.ZERO,
            dashElapsed: 0,
            dashDuration: 0,
            dashTrailTimer: 0
        };

        this.caveFairies.push(caveFairy);

        this.spawnFairyShine(position);
        this.spawnFairyParticleBurst(position);

        AudioController.getInstance().playSFX(this.assets.sounds.fairiesSpawningSFX.key);

        return caveFairy;
    }

    private updateCaveFairies(deltaT: number): void {
        for (const fairy of this.caveFairies) {
            if (fairy.finaleState === "absorbed") {
                continue;
            }

            if (fairy.finaleState === "dashing") {
                this.updateDashingFairy(fairy, deltaT);
                continue;
            }

            fairy.age += deltaT;
            fairy.origin.x += fairy.velocity.x * deltaT;
            fairy.origin.y += fairy.velocity.y * deltaT;

            fairy.sprite.position.set(
                fairy.origin.x,
                fairy.origin.y + Math.sin(fairy.age * fairy.bobFrequency + fairy.bobPhase) * fairy.bobAmplitude
            );

            const fadeAlpha = Math.min(1, fairy.age / fairy.fadeInSeconds);
            const glowPulse = (Math.sin(fairy.age * fairy.glowFrequency + fairy.glowPhase) + 1) / 2;
            const glowScale = fairy.glowBaseScale + fairy.glowPulseScale * glowPulse;
            const glowAlpha = this.lerp(fairy.glowAlphaMin, fairy.glowAlphaMax, glowPulse) * fadeAlpha;
            const sortTile = this.ground.getTilemapPosition(fairy.sprite.position.x, fairy.sprite.position.y);

            fairy.sprite.alpha = fadeAlpha;
            fairy.sprite.setSortTile(sortTile);

            fairy.glow.position.copy(fairy.sprite.position);
            fairy.glow.scale.set(glowScale, glowScale);
            fairy.glow.alpha = glowAlpha;
            fairy.glow.setSortTile(sortTile);
        }
    }

    private updateDashingFairy(fairy: CaveFairy, deltaT: number): void {
        fairy.age += deltaT;
        fairy.dashElapsed += deltaT;

        const progress = Math.min(1, fairy.dashElapsed / Math.max(0.001, fairy.dashDuration));
        const eased = 1 - Math.pow(1 - progress, 3);
        const target = this.getFairyDashTarget(fairy);
        const fadeAlpha = this.getFairyDashFadeAlpha(progress);
        const glowPulse = (Math.sin(fairy.age * fairy.glowFrequency * 1.8 + fairy.glowPhase) + 1) / 2;
        const glowScale = this.lerp(this.fairyDashGlowScaleMin, this.fairyDashGlowScaleMax, glowPulse);
        const glowAlpha = this.lerp(0.55, 1, eased) * fadeAlpha;

        fairy.sprite.position.set(
            this.lerp(fairy.dashStart.x, target.x, eased),
            this.lerp(fairy.dashStart.y, target.y, eased)
        );

        const sortTile = this.ground.getTilemapPosition(fairy.sprite.position.x, fairy.sprite.position.y);
        fairy.sprite.alpha = fadeAlpha;
        fairy.sprite.setSortTile(sortTile);

        fairy.glow.position.copy(fairy.sprite.position);
        fairy.glow.scale.set(glowScale, glowScale);
        fairy.glow.alpha = glowAlpha;
        fairy.glow.setSortTile(sortTile);

        if (progress < 0.96) {
            this.updateFairyDashTrail(fairy, target, deltaT);
        }

        if (progress >= 1) {
            this.absorbFairyIntoPlayer(fairy, target);
        }
    }

    private updateFairyDashTrail(fairy: CaveFairy, target: Vec2, deltaT: number): void {
        fairy.dashTrailTimer -= deltaT;

        while (fairy.dashTrailTimer <= 0) {
            this.emitFairyDashTrailParticle(
                fairy.sprite.position,
                fairy.sprite.position.vecTo(target)
            );
            fairy.dashTrailTimer += this.randomBetween(
                this.fairyDashTrailEmitIntervalMin,
                this.fairyDashTrailEmitIntervalMax
            );
        }
    }

    private emitFairyDashTrailParticle(position: Vec2, dashVelocity: Vec2): void {
        const particle = this.fairyParticles.find(candidate => !candidate.visible);

        if (!particle) {
            return;
        }

        const particleAI = particle.ai as FairyParticleBehavior;
        particleAI.activate({
            origin: position,
            sourceVelocity: dashVelocity,
            spawnSpread: this.fairyDashTrailSpawnSpread,
            settings: this.fairyDashTrailSettings
        });
    }

    private getFairyDashFadeAlpha(progress: number): number {
        if (progress <= 0.68) {
            return 1;
        }

        const fadeProgress = (progress - 0.68) / 0.32;
        return Math.max(0, 1 - fadeProgress * fadeProgress);
    }

    private absorbFairyIntoPlayer(fairy: CaveFairy, target: Vec2): void {
        fairy.finaleState = "absorbed";
        fairy.sprite.visible = false;
        fairy.sprite.alpha = 0;
        fairy.glow.visible = false;
        fairy.glow.alpha = 0;

        this.spawnFairyShine(target);
        this.spawnFairyParticleBurst(target);
    }

    private setupFairyShinePool(): void {
        if (this.fairyShines.length > 0) {
            return;
        }

        for (let i = 0; i < this.fairyShinePoolSize; i++) {
            const shine = this.add.sprite(
                this.assets.sprites.fairyParticle3.key,
                this.caveFairyShineLayerName
            );

            shine.visible = false;
            shine.alpha = 0;
            shine.setSortOrder(100);

            this.fairyShines.push({
                sprite: shine,
                age: 0,
                lifetime: this.fairyShineLifetimeSeconds,
                startScale: 1,
                endScale: 1,
                maxAlpha: 1
            });
        }
    }

    private spawnFairyShine(position: Vec2): void {
        const shine = this.fairyShines.find(candidate => !candidate.sprite.visible);

        if (!shine) {
            return;
        }

        shine.age = 0;
        shine.lifetime = this.fairyShineLifetimeSeconds;
        shine.startScale = this.randomBetween(1.1, 1.8);
        shine.endScale = this.randomBetween(6.8, 10.5);
        shine.maxAlpha = this.randomBetween(0.72, 1);

        shine.sprite.position.copy(position);
        shine.sprite.scale.set(shine.startScale, shine.startScale);
        shine.sprite.alpha = shine.maxAlpha;
        shine.sprite.visible = true;
        shine.sprite.setSortTile(this.ground.getTilemapPosition(position.x, position.y));
    }

    private updateFairyShines(deltaT: number): void {
        for (const shine of this.fairyShines) {
            if (!shine.sprite.visible) {
                continue;
            }

            shine.age += deltaT;
            const progress = Math.min(1, shine.age / shine.lifetime);
            const eased = 1 - Math.pow(1 - progress, 3);
            const scale = this.lerp(shine.startScale, shine.endScale, eased);

            shine.sprite.scale.set(scale, scale);
            shine.sprite.alpha = shine.maxAlpha * Math.pow(1 - progress, 2);

            if (progress >= 1) {
                shine.sprite.visible = false;
                shine.sprite.alpha = 0;
            }
        }
    }

    private setupFairyParticlePool(): void {
        if (this.fairyParticles.length > 0) {
            return;
        }

        for (let i = 0; i < this.fairyParticlePoolSize; i++) {
            const particle = this.add.sprite(
                this.assets.sprites.fairyParticle3.key,
                this.caveFairyParticleLayerName
            );

            particle.visible = false;
            particle.alpha = 0;
            particle.addAI(FairyParticleBehavior, {
                settings: this.fairyParticleSettings
            });

            this.fairyParticles.push(particle);
        }
    }

    private spawnFairyParticleBurst(position: Vec2): void {
        for (let i = 0; i < this.fairyParticlesPerSpawn; i++) {
            const particle = this.fairyParticles.find(candidate => !candidate.visible);

            if (!particle) {
                return;
            }

            const particleAI = particle.ai as FairyParticleBehavior;
            particleAI.activate({
                origin: position,
                sourceVelocity: Vec2.ZERO,
                spawnSpread: this.fairyParticleSpawnSpread,
                settings: this.fairyParticleSettings
            });
        }
    }

    private getRandomPointInCameraView(): Vec2 {
        const center = this.viewport.getCenter();
        const halfSize = this.viewport.getHalfSize();
        const paddingX = halfSize.x * this.fairyViewportPaddingRatio;
        const paddingY = halfSize.y * this.fairyViewportPaddingRatio;

        const x = this.randomBetween(
            center.x - halfSize.x + paddingX,
            center.x + halfSize.x - paddingX
        );
        const y = this.randomBetween(
            center.y - halfSize.y + paddingY,
            center.y + halfSize.y - paddingY
        );

        return new Vec2(
            Math.max(0, Math.min(this.ground.size.x, x)),
            Math.max(0, Math.min(this.ground.size.y, y))
        );
    }

    private getRandomFairyVelocity(): Vec2 {
        const speed = this.randomBetween(4, 18);
        const angle = this.randomBetween(0, Math.PI * 2);

        return new Vec2(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed * 0.45
        );
    }

    private startRandomFairyDashToPlayer(): boolean {
        const candidates = this.caveFairies.filter(fairy => fairy.finaleState === "drifting");

        if (candidates.length === 0) {
            return false;
        }

        const fairy = candidates[Math.floor(Math.random() * candidates.length)];
        fairy.finaleState = "dashing";
        fairy.dashElapsed = 0;
        fairy.dashDuration = this.randomBetween(this.fairyDashDurationMin, this.fairyDashDurationMax);
        fairy.dashTrailTimer = 0;
        fairy.dashStart = fairy.sprite.position.clone();
        fairy.dashTargetOffset = new Vec2(
            this.randomBetween(-this.fairyDashTargetSpreadX, this.fairyDashTargetSpreadX),
            this.randomBetween(-this.fairyDashTargetSpreadY, this.fairyDashTargetSpreadY * 0.35)
        );

        fairy.sprite.animation.play(
            fairy.dashStart.x > this.player.position.x ? "IDLE_LEFT" : "IDLE_RIGHT",
            true
        );

        return true;
    }

    private getFairyDashTarget(fairy: CaveFairy): Vec2 {
        return new Vec2(
            this.player.position.x + fairy.dashTargetOffset.x,
            this.player.position.y + fairy.dashTargetOffset.y
        );
    }

    private getStartedFairyDashCount(): number {
        return this.caveFairies.filter(fairy => fairy.finaleState !== "drifting").length;
    }

    private getAbsorbedFairyCount(): number {
        return this.caveFairies.filter(fairy => fairy.finaleState === "absorbed").length;
    }

    private getTargetFairyCountForRevealProgress(): number {
        const progress = this.getFairyRevealSpawnProgress();

        if (progress <= 0) {
            return 0;
        }

        if (progress >= 1) {
            return this.maxCaveFairies;
        }

        const acceleration = this.fairyRevealSpawnAcceleration;
        const exponentialProgress = (Math.exp(acceleration * progress) - 1) / (Math.exp(acceleration) - 1);

        return Math.max(1, Math.floor(this.maxCaveFairies * exponentialProgress));
    }

    private getFairyRevealSpawnProgress(): number {
        const spawnDuration = Math.max(
            0.001,
            this.fairyRevealDurationSeconds - this.fairyRevealStartDelaySeconds
        );
        const progress = (this.fairyRevealElapsed - this.fairyRevealStartDelaySeconds) / spawnDuration;

        return Math.max(0, Math.min(1, progress));
    }

    private getTargetFairyDashCountForGatherProgress(): number {
        const progress = this.getFairyGatherDashWaveProgress();

        if (progress <= 0) {
            return 0;
        }

        if (progress >= 1) {
            return this.caveFairies.length;
        }

        const acceleration = this.fairyGatherAcceleration;
        const exponentialProgress = (Math.exp(acceleration * progress) - 1) / (Math.exp(acceleration) - 1);

        return Math.max(1, Math.floor(this.caveFairies.length * exponentialProgress));
    }

    private getFairyGatherDashProgress(): number {
        const gatherDuration = Math.max(0.001, this.fairyGatherDurationSeconds);
        const progress = (this.fairyGatherElapsed - this.fairyGatherStartDelaySeconds) / gatherDuration;

        return Math.max(0, Math.min(1, progress));
    }

    private getFairyGatherDashWaveProgress(): number {
        const progress = this.getFairyGatherDashProgress()
            / Math.max(0.001, this.fairyGatherDashCompleteProgress);

        return Math.max(0, Math.min(1, progress));
    }

    private getFairyGatherLightProgress(): number {
        if (this.fairyCinematicPhase === "title") {
            return 1;
        }

        if (this.fairyCinematicPhase !== "gather") {
            return 0;
        }

        const progress = this.getFairyGatherDashProgress();
        const delayedProgress = (progress - this.caveFinalLightStartProgress)
            / Math.max(0.001, 1 - this.caveFinalLightStartProgress);

        return Math.max(0, Math.min(1, delayedProgress));
    }

    private showFinalTitle(): void {
        if (this.finalTitleShown) {
            return;
        }

        this.finalTitleShown = true;
        this.finalTitleAutoProceedElapsed = 0;
        this.fairyCinematicPhase = "title";
        this.caveDarkness.alpha = 0;
        this.caveFinalLight.alpha = this.caveFinalLightMaxAlpha;

        const viewportHalfSize = this.viewport.getHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        this.finalTitleClickOverlay.position.copy(viewportHalfSize);
        this.finalTitleClickOverlay.size.set(viewportSize.x, viewportSize.y);

        this.finalTitleOverlay.showTitle(
            "TO THE FAIRYLAND",
            undefined,
            "black",
            {
                fadeInSeconds: this.finalTitleFadeInSeconds,
                fadeOutSeconds: 0
            }
        );
    }

    private proceedFromFinalTitle(): void {
        if (this.transitioning) {
            return;
        }

        this.finalTitleOverlay.hide();
        this.transitionToCreditsAfterFinalTitle();
    }

    private transitionToCreditsAfterFinalTitle(): void {
        if (this.transitioning) {
            return;
        }

        this.transitioning = true;

        this.sceneManager.changeToScene(
            CreditsScene,
            undefined,
            undefined,
            {
                useFadeTransition: true,
                fadeOutMs: this.finalMainMenuFadeOutMs,
                fadeInMs: this.finalMainMenuFadeInMs
            }
        );
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }

    private randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}
