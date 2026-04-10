import MappedAdventureScene from "../MappedAdventureScene";
import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestScene  from "./ForestScene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";


export default class ShelterScene extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "shelter",
        path: "game_assets/tilemaps/Chapter1/Shelter.json"
    };

    // Shelter.json currently uses "Shelter" as its main walkable/render layer.
    protected readonly movementLayerName = "Ground";

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "DoorToOutside") {
            this.sceneManager.changeToScene(ForestScene , {spawnName: "Shelter", facing: Vec2.DOWN});
        }
    }
}
