import { AssetBundle } from "../MappedAdventureScene";
import MappedAdventureChapter2Scene from "./MappedAdventureChapter2Scene";
import { TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import LycanChaseSceneBase from "./LycanChaseSceneBase";

export default abstract class RoadSceneBase extends LycanChaseSceneBase {
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            bushBerriesSprite: { key: "bushBerries", path: "/assets/sprites/BushBerries.png" },
            forestTreeSprite: { key: "forestTree1", path: "/assets/sprites/ForestTree1.png" }
        },
        sounds: {},
        images: {}
    };

    private pendingLycanSpawnTilemapData: TiledTilemapData | null = null;
    private lycanSpawnDelayTimer = 0;
    private readonly lycanSpawnDelaySeconds = 0.5;
    private lycanSpawned = false;

    public override startScene(): void {
        super.startScene();
    }

    protected override updateGameplay(deltaT: number): void {
        super.updateGameplay(deltaT);
        this.updateDelayedLycanSpawn(deltaT);
    }
    
    
    protected getLycanChaseSpawnPrefix(): string | null {
        return null;
    }

    protected combinedAssetBundles(): AssetBundle {
        const sharedAssets = this.mergeAssetBundles(super.combinedAssetBundles(), RoadSceneBase.assetBundle);

        return this.mergeAssetBundles(sharedAssets, {
            tilemaps: { [this.tilemap.key]: this.tilemap },
            spritesheets: {},
            sprites: {},
            sounds: {},
            images: {}
        });
    }

    protected changeToRoadSection(scene: new (...args: any[]) => MappedAdventureChapter2Scene, spawnName: string): void {
        this.sceneManager.changeToScene(
            scene,
            {
                cheatsEnabled: this.cheatsEnabled,
                spawnName
            },
            undefined,
            {
                useFadeTransition: true,
                fadeOutMs: 300,
                fadeInMs: 300
            }
        );
    }

    protected override configureLayers(): void {
        this.getLayer("Bushes").setDepth(this.actorLayerDepth);
        this.getLayer("Ground").setDepth(2);
        this.getLayer("ForestTrees").setDepth(20);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        this.resetLycans();

        const bushLayer = tilemapData.layers.find(layer => layer.name === "Bushes");
        const bushPoints = bushLayer?.objects.filter(obj => obj.name === "BushBerries") ?? [];

        for (const point of bushPoints) {
            const bush = this.add.sprite(this.assets.sprites.bushBerriesSprite.key, "Bushes");
            bush.position.set(point.x, point.y - bush.size.y / 2 + 20);
            bush.setSortTile(this.ground.getTilemapPosition(point.x, point.y));
            bush.setSortOrder(1);
        }

        const treeLayer = tilemapData.layers.find(layer => layer.name === "ForestTrees");
        const treePoints = treeLayer?.objects ?? [];

        for (const point of treePoints) {
            const tree = this.add.sprite(this.assets.sprites.forestTreeSprite.key, "ForestTrees");
            tree.position.set(point.x, point.y - tree.size.y / 2 + 100);
        }

        if (this.storyManager.chapter2.needsToEscapeLycans()) {
            this.pendingLycanSpawnTilemapData = tilemapData;
            this.lycanSpawnDelayTimer = this.lycanSpawnDelaySeconds;
            this.lycanSpawned = false;
        }
    }

    private updateDelayedLycanSpawn(deltaT: number): void {
        if (this.lycanSpawned || !this.pendingLycanSpawnTilemapData) {
            return;
        }
    
        if (this.dialogueController.isActive) {
            return;
        }
    
        this.lycanSpawnDelayTimer -= deltaT;
    
        if (this.lycanSpawnDelayTimer > 0) {
            return;
        }
    
        const prefix = this.getLycanChaseSpawnPrefix();

        if (prefix) {
            this.spawnLycansWithPrefix(this.pendingLycanSpawnTilemapData, prefix);
            this.startAllLycanChases();
        }
    
        this.pendingLycanSpawnTilemapData = null;
        this.lycanSpawned = true;
    }
}
