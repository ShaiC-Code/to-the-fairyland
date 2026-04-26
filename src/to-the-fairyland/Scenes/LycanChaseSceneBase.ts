import { TiledObject, TiledTilemapData } from "../../Wolfie2D/DataTypes/Tilesets/TiledData";
import NPCActor from "../Actors/NPCActor";
import IdleBehavior from "../AI/NPC/NPCBehavior/IdleBehavior";
import LycanChaseBehavior from "../AI/NPC/NPCBehavior/LycanChaseBehavior";
import { AssetBundle } from "./MappedAdventureScene";
import MappedAdventureChapter2Scene from "./Chapter2/MappedAdventureChapter2Scene";

export default abstract class LycanChaseSceneBase extends MappedAdventureChapter2Scene {
    protected lycans: NPCActor[] = [];

    protected readonly lycanMoveDuration = 0.16;
    protected readonly lycanRepathInterval = 0.25;
    protected readonly lycanFeetOffsetY = 15;
    protected readonly lycanBoostMoveDuration = 0.07;
    protected readonly lycanBoostChance = 0.20;
    protected readonly lycanBoostMinSteps = 2;
    protected readonly lycanBoostMaxSteps = 5;
    protected readonly lycanBoostLocksDirection = true;

    protected static readonly lycanAssetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {
            Lycan: { key: "Lycan", path: "/assets/spritesheets/Lycan.json" }
        },
        sprites: {},
        sounds: {}
    };

    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(
            super.combinedAssetBundles(),
            LycanChaseSceneBase.lycanAssetBundle
        );
    }

    protected resetLycans(): void {
        this.lycans = [];
    }

    protected spawnLycansMatching(
        tilemapData: TiledTilemapData,
        predicate: (obj: TiledObject) => boolean
    ): void {
        const lycanLayer = tilemapData.layers.find(layer => layer.name === "EnemySpawns");
        const lycanPoints = lycanLayer?.objects.filter(predicate) ?? [];

        for (const obj of lycanPoints) {
            this.spawnLycan(obj);
        }
    }

    protected spawnLycansWithPrefix(tilemapData: TiledTilemapData, prefix: string): void {
        this.spawnLycansMatching(tilemapData, obj =>
            obj.name.startsWith(`${prefix}_`)
        );
    }

    protected startAllLycanChases(): void {
        for (const lycan of this.lycans) {
            lycan.addAI(LycanChaseBehavior, {
                player: this.player,
                ground: this.ground,
                collision: this.collision,
                startTile: lycan.getSortTile(),
                moveDuration: this.lycanMoveDuration,
                repathInterval: this.lycanRepathInterval,
                feetOffsetY: this.lycanFeetOffsetY,
                boostMoveDuration: this.lycanBoostMoveDuration,
                boostChance: this.lycanBoostChance,
                boostMinSteps: this.lycanBoostMinSteps,
                boostMaxSteps: this.lycanBoostMaxSteps,
                boostLocksDirection: this.lycanBoostLocksDirection
            });
        }
    }

    private spawnLycan(obj: TiledObject): void {
        const lycan = this.add.animatedSprite(
            NPCActor,
            this.assets.spritesheets.Lycan.key,
            this.actorLayerName
        );

        lycan.scale.set(1.25, 1.25);

        const tile = this.getObjectTile(obj);
        const tileCenter = this.ground.getTileCenter(tile.x, tile.y);

        lycan.position.set(
            tileCenter.x,
            tileCenter.y - lycan.size.y / 2 + this.lycanFeetOffsetY
        );

        lycan.setSortTile(tile);
        lycan.setSortOrder(10);

        const facing = obj.properties?.find(prop => prop.name === "facing")?.value;
        lycan.animation.play(this.getLycanIdleAnimationForFacing(facing), true);
        lycan.addAI(IdleBehavior, {});

        this.lycans.push(lycan);
    }

    private getLycanIdleAnimationForFacing(facing: string | undefined): string {
        if (facing === "up") return "IDLE_UP";
        if (facing === "left") return "IDLE_LEFT";
        if (facing === "right") return "IDLE_RIGHT";
        return "IDLE_DOWN";
    }
}
