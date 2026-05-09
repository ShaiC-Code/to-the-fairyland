import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import DesertCentipedeController from "../../AI/NPC/NPCController/DesertCentipedeController";
import AudioController from "../../GameSystems/AudioController";
import { WeatherType } from "../../GameSystems/WorldSystem/WorldState";
import MappedAdventureScene, { AssetBundle, ChapterSceneDefinition } from "../MappedAdventureScene";

export default abstract class DesertSceneBase extends MappedAdventureScene {
    protected static readonly desertAssetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            sandParticle1Sprite: { key: "sandParticle1", path: "/assets/sprites/particles/SandParticle1.png" },
            sandParticle2Sprite: { key: "sandParticle2", path: "/assets/sprites/particles/SandParticle2.png" },
            sandParticle3Sprite: { key: "sandParticle3", path: "/assets/sprites/particles/SandParticle3.png" },
            rockSprite: { key: "desertRock", path: "/assets/sprites/Rock.png" },
            desertCentipedeHead: {
                key: "desertCentipedeHead",
                path: "/assets/spritesheets/desertCentipede_pieces1.png"
            },
            desertCentipedeBody: {
                key: "desertCentipedeBody",
                path: "/assets/spritesheets/desertCentipede_pieces2.png"
            },
            desertCentipedeTail: {
                key: "desertCentipedeTail",
                path: "/assets/spritesheets/desertCentipede_pieces3.png"
            }
        },
        sounds: {
            weatherSandStormSFX: { key: "weather-sandstorm", path: "/assets/sounds/weather-sandstorm.ogg" },
            walkingSandSFX: { key: "walking-sand", path: "/assets/sounds/walking-sand.ogg" },
            centipedesCrawlingSFX: { key: "centipedes-crawling", path: "/assets/sounds/centipedes-crawling.ogg" },
            centipedesAttackingSFX: { key: "centipedes-attacking", path: "/assets/sounds/centipedes-attacking.ogg" }
        },
        images: {}
    };

    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {},
        dialogueChoiceActionHandlers: {}
    };

    protected readonly centipedeLayerName = "Centipedes";
    protected readonly enemySpawnLayerName = "EnemySpawns";
    protected readonly centipedeLayerDepthOffset = 100;
    protected readonly defaultCentipedeBodySegments = 5;
    protected readonly centipedeHeadToBodySegmentSpacing = 32;
    protected readonly centipedeBodyToBodySegmentSpacing = 32;
    protected readonly centipedeBodyToTailSegmentSpacing = 32;
    protected readonly centipedeRotationOffsetDegrees = 180;
    protected readonly centipedeScale = 1;

    protected readonly centipedeMoveSpeed = 450;
    protected readonly centipedeChargeMoveSpeed = 850;
    protected readonly centipedeHeadSteerTurnSpeedDegrees = 100;
    protected readonly centipedeMaxTurnSpeedDegrees = 360;

    protected readonly centipedeAggroStartDistance = 600;
    protected readonly centipedeMinAggroDurationSeconds = 1;
    protected readonly centipedeMaxAggroDurationSeconds = 1.3;
    protected readonly centipedeChargeGuidanceDurationSeconds = 0.3;
    protected readonly centipedeChargeDurationSeconds = 2;
    protected readonly centipedeCatchUpStartDistance = 1050;
    protected readonly centipedeCatchUpMaxDistance = 1800;
    protected readonly centipedeCatchUpMaxSpeedMultiplier = 1.8;
    protected readonly centipedeCatchUpTurnSpeedMultiplier = 1.8;

    protected readonly centipedeMovementVariation = 0.14;
    protected readonly centipedeTurnVariation = 0.18;
    protected readonly centipedeTimingVariation = 0.22;
    protected readonly centipedeSpacingVariation = 0.08;
    protected readonly centipedeScaleVariation = 0.08;
    protected readonly centipedeCatchUpVariation = 0.16;

    private readonly centipedes: DesertCentipedeController[] = [];

    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), DesertSceneBase.desertAssetBundle);
    }

    public override unloadScene(): void {
        super.unloadScene();
        AudioController.getInstance().stopSound(this.assets.sounds.walkingSandSFX.key);
    }

    public override startScene(): void {
        super.startScene();
        this.weatherController.setWeather(WeatherType.SANDSTORM, 50);
    }

    protected override updateGameplay(deltaT: number): void {
        super.updateGameplay(deltaT);

        if (this.dialogueController.isActive) {
            return;
        }

        for (const centipede of this.centipedes) {
            centipede.update(deltaT, this.player.position);
        }
    }

    protected override configureLayers(): void {
        this.addLayer(this.centipedeLayerName, this.actorLayerDepth + this.centipedeLayerDepthOffset);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        this.centipedes.length = 0;

        const enemySpawnLayer = tilemapData.layers.find(layer => layer.name === this.enemySpawnLayerName);
        const centipedeSpawns = enemySpawnLayer?.objects.filter(obj =>
            obj.name.startsWith("Desert_Centipede")
        ) ?? [];

        for (const spawn of centipedeSpawns) {
            this.spawnDesertCentipede(spawn);
        }
    }

    private spawnDesertCentipede(spawn: TiledObject): void {
        const spawnTile = this.getObjectTile(spawn);

        this.spawnDesertCentipedeAtTile(spawnTile, {
            facing: this.getStringProperty(spawn, "facing"),
            bodySegments: this.getNumberProperty(
                spawn,
                "bodySegments",
                this.defaultCentipedeBodySegments
            )
        });
    }

    protected spawnDesertCentipedeAtTile(
        spawnTile: Vec2,
        options: { facing?: string; bodySegments?: number } = {}
    ): void {
        const spawnPosition = this.ground.getTileCenter(spawnTile.x, spawnTile.y);
        const movementMultiplier = this.getRandomMultiplier(this.centipedeMovementVariation);
        const chargeMultiplier = this.getRandomMultiplier(this.centipedeMovementVariation);
        const turnMultiplier = this.getRandomMultiplier(this.centipedeTurnVariation);
        const timingMultiplier = this.getRandomMultiplier(this.centipedeTimingVariation);
        const scaleMultiplier = this.getRandomMultiplier(this.centipedeScaleVariation);
        const spacingMultiplier = scaleMultiplier * this.getRandomMultiplier(this.centipedeSpacingVariation);
        const catchUpDistanceMultiplier = this.getRandomMultiplier(this.centipedeCatchUpVariation);
        const catchUpSpeedMultiplier = this.getRandomMultiplier(this.centipedeCatchUpVariation);
        const catchUpTurnMultiplier = this.getRandomMultiplier(this.centipedeCatchUpVariation);

        this.centipedes.push(new DesertCentipedeController({
            scene: this,
            layerName: this.centipedeLayerName,
            startPosition: spawnPosition,
            facing: options.facing,
            bodySegments: options.bodySegments ?? this.defaultCentipedeBodySegments,
            spriteKeys: {
                head: this.assets.sprites.desertCentipedeHead.key,
                body: this.assets.sprites.desertCentipedeBody.key,
                tail: this.assets.sprites.desertCentipedeTail.key
            },
            headToBodySegmentSpacing: this.centipedeHeadToBodySegmentSpacing * spacingMultiplier,
            bodyToBodySegmentSpacing: this.centipedeBodyToBodySegmentSpacing * spacingMultiplier,
            bodyToTailSegmentSpacing: this.centipedeBodyToTailSegmentSpacing * spacingMultiplier,
            moveSpeed: this.centipedeMoveSpeed * movementMultiplier,
            chargeMoveSpeed: this.centipedeChargeMoveSpeed * chargeMultiplier,
            headSteerTurnSpeed: this.degreesToRadians(this.centipedeHeadSteerTurnSpeedDegrees) * turnMultiplier,
            aggroStartDistance: this.centipedeAggroStartDistance * this.getRandomMultiplier(this.centipedeMovementVariation),
            minAggroDuration: this.centipedeMinAggroDurationSeconds * timingMultiplier,
            maxAggroDuration: this.centipedeMaxAggroDurationSeconds * timingMultiplier,
            chargeGuidanceDuration: this.centipedeChargeGuidanceDurationSeconds * timingMultiplier,
            chargeDuration: this.centipedeChargeDurationSeconds * this.getRandomMultiplier(this.centipedeTimingVariation),
            maxTurnSpeed: this.degreesToRadians(this.centipedeMaxTurnSpeedDegrees) * turnMultiplier,
            catchUpStartDistance: this.centipedeCatchUpStartDistance * catchUpDistanceMultiplier,
            catchUpMaxDistance: this.centipedeCatchUpMaxDistance * catchUpDistanceMultiplier,
            catchUpMaxSpeedMultiplier: this.centipedeCatchUpMaxSpeedMultiplier * catchUpSpeedMultiplier,
            catchUpTurnSpeedMultiplier: this.centipedeCatchUpTurnSpeedMultiplier * catchUpTurnMultiplier,
            rotationOffset: this.degreesToRadians(this.centipedeRotationOffsetDegrees),
            scale: this.centipedeScale * scaleMultiplier
        }));
    }

    private degreesToRadians(degrees: number): number {
        return degrees * Math.PI / 180;
    }

    private getRandomMultiplier(variation: number): number {
        const clampedVariation = Math.max(0, Math.min(variation, 0.9));
        return 1 - clampedVariation + Math.random() * clampedVariation * 2;
    }

    private getStringProperty(obj: TiledObject, name: string): string | undefined {
        const value = obj.properties?.find(prop => prop.name === name)?.value;
        return typeof value === "string" ? value : undefined;
    }

    private getNumberProperty(obj: TiledObject, name: string, fallback: number): number {
        const value = obj.properties?.find(prop => prop.name === name)?.value;
        const numberValue = Number(value);

        return Number.isFinite(numberValue) ? numberValue : fallback;
    }
}
