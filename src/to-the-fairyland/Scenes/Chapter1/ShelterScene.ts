import MappedAdventureScene from "../MappedAdventureScene";

export default class ShelterScene extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "shelter",
        path: "game_assets/tilemaps/Chapter1/Shelter.json"
    };

    // Shelter.json currently uses "Shelter" as its main walkable/render layer.
    protected readonly movementLayerName = "Ground";
}
