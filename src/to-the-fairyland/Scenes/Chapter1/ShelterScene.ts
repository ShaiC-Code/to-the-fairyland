import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestScene  from "./ForestScene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import { AssetBundle } from "../MappedAdventureScene";
import MappedAdventureChapter1Scene from "./MappedAdventureChapter1Scene";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";
import { getBedDialogue, getPotDialogue } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import { WeatherType } from "../../GameSystems/WorldSystem/WorldState";

export default class ShelterScene extends MappedAdventureChapter1Scene {
    protected readonly tilemap = {
        key: "shelter",
        path: "/assets/tilemaps/Chapter1/Shelter.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {
            shelter: { key: "shelter", path: "/assets/tilemaps/Chapter1/Shelter.json" }
        },
        spritesheets: {},
        sprites: {
            bedSprite: { key: "bed", path: "/assets/sprites/Bed.png" },
            potSprite: { key: "pot", path: "/assets/sprites/Pot.png" }
        },
        sounds: {}
    };

    // Shelter.json currently uses "Shelter" as its main walkable/render layer.
    protected readonly movementLayerName = "Ground";

    protected combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), ShelterScene.assetBundle);
    }

    public override startScene(): void {
        super.startScene();
        this.weatherController.setWeather(WeatherType.SNOW, 1);
    }

    protected override configureLayers(): void {
        this.getLayer("Interactables").setDepth(this.actorLayerDepth);
        this.getLayer("Background").setDepth(0);
        this.getLayer("Ground").setDepth(2);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables");
        const bedObjects = interactLayer?.objects.filter(obj => obj.name === "Bed") ?? [];
        const potObjects = interactLayer?.objects.filter(obj => obj.name === "Pot") ?? [];

        for (const obj of bedObjects) {
            const bed = this.add.sprite(this.assets.sprites.bedSprite.key, "Interactables");
            bed.position.set(obj.x + obj.width / 2, obj.y + obj.height / 2);
        }

        for (const obj of potObjects) {
            const pot = this.add.sprite(this.assets.sprites.potSprite.key, "Interactables");
            pot.position.set(obj.x + obj.width / 2, obj.y + obj.height - pot.size.y / 2);
        }
    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "Bed") {
            const step = this.storyManager.chapter1.getMainQuestStep();
            const dialogue = getBedDialogue(step);
            this.dialogueController.startDialogue(dialogue);
            return;
        }

        if (obj.name === "Pot") {
            const step = this.storyManager.chapter1.getMainQuestStep();
            const dialogue = getPotDialogue(step);
            this.dialogueController.startDialogue(dialogue);
            return;
        }

        this.tryStartInteractionDialogue(obj);
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "DoorToOutside") {
            this.sceneManager.changeToScene(
                ForestScene, 
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "Outside",
                    facing: Vec2.DOWN
                },
                undefined,
                {
                    useFadeTransition: true,
                    fadeOutMs: 300,
                    fadeInMs: 300
                }
            );
            this.emitter.fireEvent(GameEventType.PLAY_SFX, {key: this.assets.sounds.woodenDoorSFX.key, loop: false, holdReference: false});
        }
    }
}
