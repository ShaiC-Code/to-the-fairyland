import MappedAdventureScene from "../MappedAdventureScene";
import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestScene  from "./ForestScene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";


export default class ShelterScene extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "shelter",
        path: "game_assets/tilemaps/Chapter1/Shelter.json"
    };

    // Shelter.json currently uses "Shelter" as its main walkable/render layer.
    protected readonly movementLayerName = "Ground";

    protected override loadExtraAssets(): void {
        this.load.image("bed", "game_assets/sprites/Bed.png")
    }

    protected override configureLayers(): void {
        this.getLayer("Interactables").setDepth(this.actorLayerDepth);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables");
        const bedObjects = interactLayer?.objects.filter(obj => obj.name === "Bed") ?? [];

        for (const obj of bedObjects) {
            const bed = this.add.sprite("bed", "Interactables");
            bed.position.set(obj.x + obj.width / 2, obj.y + obj.height / 2);
        }

    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "DoorToOutside") {
            this.sceneManager.changeToScene(ForestScene , {spawnName: "Shelter", facing: Vec2.DOWN});
        }
    }
}
