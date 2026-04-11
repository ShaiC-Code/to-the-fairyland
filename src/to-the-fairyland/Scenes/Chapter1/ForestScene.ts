import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import MappedAdventureScene from "../MappedAdventureScene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import ShelterScene from "./ShelterScene";
import { TimeOfDay } from "../MappedAdventureScene";


export default class ForestScene  extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "chapter1",
        path: "game_assets/tilemaps/Chapter1/Chapter1.json"
    };
    
    protected override loadExtraAssets(): void {
        this.load.image("snowTree1", "game_assets/sprites/SnowTree1.png");
        this.load.image("bushBerries", "game_assets/sprites/BushBerries.png");
        this.load.image("mapItem", "game_assets/sprites/MapItem.png");
    }

    public override startScene(): void {
        super.startScene();
        this.setTimeOfDay(TimeOfDay.DUSK);
    }

    protected override configureLayers(): void {
        this.getLayer("Interactables").setDepth(this.actorLayerDepth);
        this.getLayer("Trees").setDepth(20);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        const treeLayer = tilemapData.layers.find(layer => layer.name === "Trees");
        const treePoints = treeLayer?.objects ?? [];

        // Display all the trees
        for (const point of treePoints) {
            const tree = this.add.sprite("snowTree1", "Trees");
            tree.position.set(point.x, point.y - tree.size.y / 2);
        }

        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables");
        const bushPoints = interactLayer?.objects.filter(obj => obj.name === "BushBerries") ?? [];

        //Display all the bushes
        for (const point of bushPoints) {
            const bush = this.add.sprite("bushBerries", "Interactables");
            bush.position.set(point.x, point.y - bush.size.y / 2 + 20);

            bush.setSortTile(this.ground.getTilemapPosition(point.x, point.y));
            bush.setSortOrder(1);
        }

        // Display the map item to be picked up
        const mapItemObj = interactLayer?.objects.find(obj => obj.name === "MapItem");
        if (mapItemObj) {
            const mapItem = this.add.sprite("mapItem", "Interactables");
            mapItem.position.set(mapItemObj.x, mapItemObj.y);
            mapItem.setSortTile(this.ground.getTilemapPosition(mapItemObj.x, mapItemObj.y));
            mapItem.setSortOrder(1);
        }
    }

    protected override handleInteraction(obj: TiledObject): void {

        if (obj.name === "BushBerries") {
            const bushTile = this.getObjectTile(obj);

        }
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "DoorToShelter") {
            this.sceneManager.changeToScene(ShelterScene, {spawnName: "Shelter", facing: Vec2.UP});
        }
    }

}
