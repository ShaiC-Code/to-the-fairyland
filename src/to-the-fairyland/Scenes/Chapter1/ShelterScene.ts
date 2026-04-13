import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ForestScene  from "./ForestScene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import MappedAdventureScene, { WeatherType } from "../MappedAdventureScene";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";
import { getBedDialogue, getPotDialogue } from "../../GameSystems/InteractionSystem/InteractionDatabase";



export default class ShelterScene extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "shelter",
        path: "game_assets/tilemaps/Chapter1/Shelter.json"
    };

    protected readonly bedImage = {
        key: "bed",
        path: "game_assets/sprites/Bed.png"
    };

    protected readonly potImage = {
        key: "pot",
        path: "game_assets/sprites/Pot.png"
    };

    // Shelter.json currently uses "Shelter" as its main walkable/render layer.
    protected readonly movementLayerName = "Ground";

    protected override loadExtraAssets(): void {
        this.load.image(this.bedImage.key, this.bedImage.path);
        this.load.image(this.potImage.key, this.potImage.path);
    }

    public override startScene(): void {
        super.startScene();
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
        const potObjects = interactLayer?.objects.filter(obj => obj.name === "Pot") ?? [];

        for (const obj of bedObjects) {
            const bed = this.add.sprite(this.bedImage.key, "Interactables");
            bed.position.set(obj.x + obj.width / 2, obj.y + obj.height / 2);
        }

        for (const obj of potObjects) {
            const pot = this.add.sprite(this.potImage.key, "Interactables");
            pot.position.set(obj.x + obj.width / 2, obj.y + obj.height / 2);
        }
    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "Bed") {
            const step = this.storyManager.getChapter1MainQuestStep();
            const dialogue = getBedDialogue(step);
            this.startDialogue(dialogue);
            return;
        }

        if (obj.name === "Pot") {
            const step = this.storyManager.getChapter1MainQuestStep();
            const dialogue = getPotDialogue(step);
            this.startDialogue(dialogue);
            return;
        }

        this.tryStartInteractionDialogue(obj);
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "DoorToOutside") {
            this.sceneManager.changeToScene(
                ForestScene, 
                {spawnName: "Outside", facing: Vec2.DOWN},
                undefined,
                {
                    useFadeTransition: true,
                    fadeOutMs: 300,
                    fadeInMs: 300
                }
            );
            this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: this.woodenDoorSFX.key, loop: false, holdReference: false});
        }
    }

    protected override isWeatherAmbienceIndoors(): boolean {
        return true;
    }
}
