import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import { TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import FairyParticleBehavior, {
    defaultFairyParticleSettings,
    FairyParticleSettings
} from "../../AI/FairyParticleBehavior";
import PlayerAI from "../../AI/Player/PlayerAI";
import { PlayerControlMode } from "../../AI/Player/PlayerController";
import MappedAdventureScene, {
    AssetBundle,
    ChapterSceneDefinition
} from "../MappedAdventureScene";

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
            }
        },
        sounds: {},
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

    private dolphin: AnimatedSprite | null = null;
    private dolphinParticles: Sprite[] = [];
    private dolphinParticleEmitTimer = 0;

    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), UndergroundCaveScene.assetBundle);
    }

    protected override configureLayers(): void {
        this.getLayer(this.bushesLayerName).setDepth(this.actorLayerDepth);
        this.getLayer(this.groundLayerName).setDepth(2);
        this.addLayer(this.dolphinParticleLayerName, this.actorLayerDepth + 0.5);
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
        super.startScene();
        this.player.position.y += 25;
        this.putPlayerInDrownMode();
    }

    protected override canPlayerAttack(): boolean {
        return false;
    }

    protected override updateGameplay(deltaT: number): void {
        super.updateGameplay(deltaT);
        this.updateDolphinParticleEmission(deltaT);
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

    private randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}
