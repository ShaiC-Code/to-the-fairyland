import MappedAdventureScene, {
    AssetBundle,
    ChapterSceneDefinition
} from "../MappedAdventureScene";
import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import DesertCentipedeController from "./DesertCentipedeController";
import { WeatherType } from "../../GameSystems/WorldSystem/WorldState";
import AudioController from "../../GameSystems/AudioController";

export default class DesertLandScene extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "desertLand",
        path: "/assets/tilemaps/Chapter6/DesertLand.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {
            desertLand: {
                key: "desertLand",
                path: "/assets/tilemaps/Chapter6/DesertLand.json"
            }
        },
        spritesheets: {},
        sprites: {
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
            centipedesCrawlingSFX: {key: "centipedes-crawling", path: "/assets/sounds/centipedes-crawling.ogg" }
        },
        images: {}
    };

    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {},
        dialogueChoiceActionHandlers: {}
    };

    private readonly centipedeLayerName = "Centipedes";
    private readonly enemySpawnLayerName = "EnemySpawns";
    private readonly centipedeLayerDepthOffset = 100;
    private readonly defaultCentipedeBodySegments = 5;
    private readonly centipedeHeadToBodySegmentSpacing = 32;
    private readonly centipedeBodyToBodySegmentSpacing = 32;
    private readonly centipedeBodyToTailSegmentSpacing = 32;
    private readonly centipedeRotationOffsetDegrees = 180;
    private readonly centipedeScale = 1;

    private readonly centipedeMoveSpeed = 450;
    private readonly centipedeChargeMoveSpeed = 850;
    private readonly centipedeHeadSteerTurnSpeedDegrees = 100;
    private readonly centipedeMaxTurnSpeedDegrees = 360;

    private readonly centipedeAggroStartDistance = 600;
    private readonly centipedeMinAggroDurationSeconds = 1;
    private readonly centipedeMaxAggroDurationSeconds = 1.3;
    private readonly centipedeChargeGuidanceDurationSeconds = 0.3;
    private readonly centipedeChargeDurationSeconds = 2;


    private readonly centipedes: DesertCentipedeController[] = [];

    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), DesertLandScene.assetBundle);
    }
    
    public override unloadScene(): void {
        super.unloadScene();
    
        // Stop sfx when changing scenes
        AudioController.getInstance().stopSound(this.assets.sounds.walkingSandSFX.key);
    }
    
    public override startScene(): void {
        super.startScene();
        this.weatherController.setWeather(WeatherType.SANDSTORM, 50);
    }

    protected override configureLayers(): void {
        this.addLayer(this.centipedeLayerName, this.actorLayerDepth + this.centipedeLayerDepthOffset);
    }

    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);

        if (this.worldPaused || this.dialogueController.isActive) {
            return;
        }

        for (const centipede of this.centipedes) {
            centipede.update(deltaT, this.player.position);
        }
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
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
        const spawnPosition = this.ground.getTileCenter(spawnTile.x, spawnTile.y);

        this.centipedes.push(new DesertCentipedeController({
            scene: this,
            layerName: this.centipedeLayerName,
            startPosition: spawnPosition,
            facing: this.getStringProperty(spawn, "facing"),
            bodySegments: this.getNumberProperty(
                spawn,
                "bodySegments",
                this.defaultCentipedeBodySegments
            ),
            spriteKeys: {
                head: this.assets.sprites.desertCentipedeHead.key,
                body: this.assets.sprites.desertCentipedeBody.key,
                tail: this.assets.sprites.desertCentipedeTail.key
            },
            headToBodySegmentSpacing: this.centipedeHeadToBodySegmentSpacing,
            bodyToBodySegmentSpacing: this.centipedeBodyToBodySegmentSpacing,
            bodyToTailSegmentSpacing: this.centipedeBodyToTailSegmentSpacing,
            moveSpeed: this.centipedeMoveSpeed,
            chargeMoveSpeed: this.centipedeChargeMoveSpeed,
            headSteerTurnSpeed: this.degreesToRadians(this.centipedeHeadSteerTurnSpeedDegrees),
            aggroStartDistance: this.centipedeAggroStartDistance,
            minAggroDuration: this.centipedeMinAggroDurationSeconds,
            maxAggroDuration: this.centipedeMaxAggroDurationSeconds,
            chargeGuidanceDuration: this.centipedeChargeGuidanceDurationSeconds,
            chargeDuration: this.centipedeChargeDurationSeconds,
            maxTurnSpeed: this.degreesToRadians(this.centipedeMaxTurnSpeedDegrees),
            rotationOffset: this.degreesToRadians(this.centipedeRotationOffsetDegrees),
            scale: this.centipedeScale
        }));
    }

    private degreesToRadians(degrees: number): number {
        return degrees * Math.PI / 180;
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
