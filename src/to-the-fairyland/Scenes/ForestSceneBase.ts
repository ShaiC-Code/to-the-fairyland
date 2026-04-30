import { TiledTilemapData } from "../../Wolfie2D/DataTypes/Tilesets/TiledData";
import MappedAdventureScene, { AssetBundle, ChapterSceneDefinition } from "./MappedAdventureScene";

export default abstract class ForestSceneBase extends MappedAdventureScene {
    protected static readonly forestAssetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            bushBerriesSprite: { key: "bushBerries", path: "/assets/sprites/BushBerries.png" },
            forestTreeSprite: { key: "forestTree1", path: "/assets/sprites/ForestTree1.png" }
        },
        sounds: {}
    };

    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {},
        dialogueChoiceActionHandlers: {}
    };

    protected override combinedAssetBundles(): AssetBundle {
        const sharedAssets = this.mergeAssetBundles(
            super.combinedAssetBundles(),
            ForestSceneBase.forestAssetBundle
        );

        return this.mergeAssetBundles(sharedAssets, {
            tilemaps: { [this.tilemap.key]: this.tilemap },
            spritesheets: {},
            sprites: {},
            sounds: {}
        });
    }

    protected override configureLayers(): void {
        this.getLayer("Bushes").setDepth(this.actorLayerDepth);
        this.getLayer("Ground").setDepth(2);
        this.getLayer("ForestTrees").setDepth(20);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
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
    }

    protected changeToForestSection(
        scene: new (...args: any[]) => ForestSceneBase,
        spawnName: string
    ): void {
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
    
}
