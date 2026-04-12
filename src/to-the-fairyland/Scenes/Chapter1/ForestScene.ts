import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import ShelterScene from "./ShelterScene";
import MappedAdventureScene, { WeatherType } from "../MappedAdventureScene";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";


export default class ForestScene extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "chapter1",
        path: "game_assets/tilemaps/Chapter1/Chapter1.json"
    };

    protected readonly snowTreeImage = {
        key: "snowTree1",
        path: "game_assets/sprites/SnowTree1.png"
    };

    protected readonly bushBerriesImage = {
        key: "bushBerries",
        path: "game_assets/sprites/BushBerries.png"
    };

    protected readonly mapItemImage = {
        key: "mapItem",
        path: "game_assets/sprites/MapItem.png"
    };
    
    protected override loadExtraAssets(): void {
        this.load.image(this.snowTreeImage.key, this.snowTreeImage.path);
        this.load.image(this.bushBerriesImage.key, this.bushBerriesImage.path);
        this.load.image(this.mapItemImage.key, this.mapItemImage.path);
    }

    public override startScene(): void {
        super.startScene();
        this.setWeather(WeatherType.SNOWSTORM, 50);
    }

    protected override configureLayers(): void {
        this.getLayer("Interactables").setDepth(this.actorLayerDepth);
        this.getLayer("Trees").setDepth(20);
        this.getLayer("Ground").setDepth(2);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        const treeLayer = tilemapData.layers.find(layer => layer.name === "Trees");
        const treePoints = treeLayer?.objects ?? [];

        // Display all the trees
        for (const point of treePoints) {
            const tree = this.add.sprite(this.snowTreeImage.key, "Trees");
            tree.position.set(point.x, point.y - tree.size.y / 2);
        }

        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables");
        const bushPoints = interactLayer?.objects.filter(obj => obj.name === "BushBerries") ?? [];

        //Display all the bushes
        for (const point of bushPoints) {
            const bush = this.add.sprite(this.bushBerriesImage.key, "Interactables");
            bush.position.set(point.x, point.y - bush.size.y / 2 + 20);

            bush.setSortTile(this.ground.getTilemapPosition(point.x, point.y));
            bush.setSortOrder(1);
        }

        // Display the map item to be picked up
        const mapItemObj = interactLayer?.objects.find(obj => obj.name === "MapItem");
        if (mapItemObj) {
            const mapItem = this.add.sprite(this.mapItemImage.key, "Interactables");
            mapItem.position.set(mapItemObj.x, mapItemObj.y);
            mapItem.setSortTile(this.ground.getTilemapPosition(mapItemObj.x, mapItemObj.y));
            mapItem.setSortOrder(1);
        }
    }

    protected override handleInteraction(obj: TiledObject): void {
        this.tryStartInteractionDialogue(obj);
    }
    

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "DoorToShelter") {
            this.sceneManager.changeToScene(ShelterScene, {spawnName: "Shelter", facing: Vec2.UP});
            this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: this.woodenDoorSFX.key, loop: false, holdReference: false});
        }
    }


}
