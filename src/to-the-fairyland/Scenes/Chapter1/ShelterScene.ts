import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestScene  from "./ForestScene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import MappedAdventureScene, { TimeOfDay, WeatherType } from "../MappedAdventureScene";



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

    public override startScene(): void {
        super.startScene();
        this.setTimeOfDay(TimeOfDay.DUSK);
        this.setWeather(WeatherType.SNOW, 1);
    }

    protected override configureLayers(): void {
        this.getLayer("Interactables").setDepth(this.actorLayerDepth);
        this.getLayer("Background").setDepth(0);
        this.getLayer("Ground").setDepth(2);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables");
        const bedObjects = interactLayer?.objects.filter(obj => obj.name === "Bed") ?? [];

        for (const obj of bedObjects) {
            const bed = this.add.sprite("bed", "Interactables");
            bed.position.set(obj.x + obj.width / 2, obj.y + obj.height / 2);
        }

    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "DoorToOutside") {
            this.sceneManager.changeToScene(ForestScene, {spawnName: "Outside", facing: Vec2.DOWN});
        }
    }
    
}
