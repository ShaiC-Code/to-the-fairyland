import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import MappedAdventureScene from "../MappedAdventureScene";
import ShelterScene from "./ShelterScene";

export default class Chapter1Scene extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "chapter1",
        path: "game_assets/tilemaps/Chapter1/Chapter1.json"
    };
    

    protected override loadExtraAssets(): void {
        this.load.image("snowTree1", "game_assets/sprites/SnowTree1.png");
    }

    protected override configureLayers(): void {
        this.getLayer("Trees").setDepth(20);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        const treeLayer = tilemapData.layers.find(layer => layer.name === "Trees");
        const treePoints = treeLayer?.objects ?? [];

        for (const point of treePoints) {
            const tree = this.add.sprite("snowTree1", "Trees");
            tree.position.set(point.x, point.y - tree.size.y / 2);
        }
    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "Door") {
            this.sceneManager.changeToScene(ShelterScene);
        }
    }
}
