import { AssetBundle } from "../MappedAdventureScene";
import MappedAdventureChapter2Scene from "./MappedAdventureChapter2Scene";
import VillageScene from "./VillageScene";
import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import { TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";

export default class RoadScene extends MappedAdventureChapter2Scene {
    protected readonly tilemap = {
        key: "road",
        path: "/assets/tilemaps/Chapter2/Road.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {
            road: { key: "road", path: "/assets/tilemaps/Chapter2/Road.json" }
        },
        spritesheets: {},
        sprites: {
            bushBerriesSprite: { key: "bushBerries", path: "/assets/sprites/BushBerries.png" },
            forestTreeSprite: { key: "forestTree1", path: "/assets/sprites/ForestTree1.png" }

        },
        sounds: {}
    };

    protected combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), RoadScene.assetBundle);
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToVillage") {
            this.sceneManager.changeToScene(
                VillageScene,
                { spawnName: "RoadEnd" },
                undefined,
                {
                    useFadeTransition: true,
                    fadeOutMs: 300,
                    fadeInMs: 300
                }
            );
        }
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
            tree.position.set(point.x, point.y - tree.size.y / 2);
        }

    }
    

}