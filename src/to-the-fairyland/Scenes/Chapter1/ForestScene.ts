import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import ShelterScene from "./ShelterScene";
import { AssetBundle } from "../MappedAdventureScene";
import MappedAdventureChapter1Scene from "./MappedAdventureChapter1Scene";
import { Chapter1MainQuestStep } from "../../GameSystems/StorySystem/StoryState";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import { WeatherType } from "../../GameSystems/WorldSystem/WorldState";
import Timer from "../../../Wolfie2D/Timing/Timer";
import NullFunc from "../../../Wolfie2D/DataTypes/Functions/NullFunc";
import { getBushBerriesDialogue } from "../../GameSystems/InteractionSystem/ObjectInteractions";
import AudioController from "../../GameSystems/AudioController";

export default class ForestScene extends MappedAdventureChapter1Scene {
    protected readonly tilemap = {
        key: "chapter1",
        path: "/assets/tilemaps/Chapter1/Chapter1.json"
    };
    
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            snowTreeSprite: { key: "snowTree1", path: "/assets/sprites/SnowTree1.png" },
            bushBerriesSprite: { key: "bushBerries", path: "/assets/sprites/BushBerries.png" },
            mapItemSprite: { key: "mapItem", path: "/assets/sprites/MapItem.png" }
        },
        sounds: {},
        images: {}
    };
    
    private mapItemSprite: Sprite | null = null;
    private mapItemObject: TiledObject | null = null;
    protected howlEvent?: Timer;

    protected combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), ForestScene.assetBundle);
    }

    public override startScene(): void {
        super.startScene();
        this.weatherController.setWeather(WeatherType.SNOWSTORM, 50);
        this.howlEvent = new Timer(0, () => {
            AudioController.getInstance().playSFX(this.assets.sounds.wolvesHowlingSFX.key);
            this.setHowlEventTimer();
        });
        this.setHowlEventTimer();
    }

    protected override configureLayers(): void {
        this.getLayer("Interactables").setDepth(this.actorLayerDepth);
        this.getLayer("BloodStain").setDepth(this.actorLayerDepth);
        this.getLayer("Trees").setDepth(20);
        this.getLayer("Ground").setDepth(2);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        const treeLayer = tilemapData.layers.find(layer => layer.name === "Trees");
        const treePoints = treeLayer?.objects ?? [];

        // Display all the trees
        for (const point of treePoints) {
            const tree = this.add.sprite(this.assets.sprites.snowTreeSprite.key, "Trees");
            tree.position.set(point.x, point.y - tree.size.y / 2);
        }

        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables");
        const bushPoints = interactLayer?.objects.filter(obj => obj.name === "BushBerries") ?? [];

        //Display all the bushes
        for (const point of bushPoints) {
            const bush = this.add.sprite(this.assets.sprites.bushBerriesSprite.key, "Interactables");
            bush.position.set(point.x, point.y - bush.size.y / 2 + 20);

            bush.setSortTile(this.ground.getTilemapPosition(point.x, point.y));
            bush.setSortOrder(1);
        }

        const step = this.storyManager.chapter1.getMainQuestStep();
        
        // Display the map item to be picked up
        const mapItemObj = interactLayer?.objects.find(obj => obj.name === "MapItem");
        if (step === Chapter1MainQuestStep.SLEPT && mapItemObj) {
            const mapItem = this.add.sprite(this.assets.sprites.mapItemSprite.key, "Interactables");
            mapItem.position.set(mapItemObj.x, mapItemObj.y);
            mapItem.setSortTile(this.ground.getTilemapPosition(mapItemObj.x, mapItemObj.y));
            mapItem.setSortOrder(1);        
            
            this.mapItemObject = mapItemObj;
            this.mapItemSprite = mapItem;
        }
        
        const bloodStain = this.getRequiredTilemap("BloodStain");

        bloodStain.visible =
            step === Chapter1MainQuestStep.SLEPT ||
            step === Chapter1MainQuestStep.MAP_PICKED;

    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "BushBerries") {
            const step = this.storyManager.chapter1.getMainQuestStep();
            const dialogue = getBushBerriesDialogue(step);
            this.startDialogue(dialogue);
            return;
        }

        this.tryStartInteractionDialogue(obj);
    }
    
    protected override handleAutoTransition(obj: TiledObject): void {        
        if (obj.name === "DoorToShelter") {
            this.sceneManager.changeToScene(
                ShelterScene, 
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "Shelter",
                    facing: Vec2.UP
                },
                undefined,
                {
                    useFadeTransition: true,
                    fadeOutMs: 300,
                    fadeInMs: 300
                }
            );
            AudioController.getInstance().playSFX(this.assets.sounds.woodenDoorSFX.key);
        }
    }

    protected setHowlEventTimer() {
        if (!this.howlEvent) {
            this.howlEvent = new Timer(0, NullFunc);
        }

        const delay = (Math.random() * 20000) + 10000;
        this.howlEvent.start(delay);
    }

    protected override onMapPickedUp(): void {
        if (this.mapItemSprite) {
            this.mapItemSprite.destroy();
            this.mapItemSprite = null;
        }
    
        if (this.mapItemObject) {
            this.interactables = this.interactables.filter(obj => obj !== this.mapItemObject);
            this.mapItemObject = null;
        }
    }
    

}
