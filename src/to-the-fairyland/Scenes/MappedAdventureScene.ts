import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import { TiledObject, TiledTilemapData, TiledLayerData} from "../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Input from "../../Wolfie2D/Input/Input";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Scene from "../../Wolfie2D/Scene/Scene";
import PlayerActor from "../Actors/PlayerActor";
import PlayerAI from "../AI/Player/PlayerAI";
import PauseScreen from "../UI/PauseScreen";
import InventoryScreen from "../UI/InventoryScreen";
import MainMenu from "./MainMenu";
import { CustomUIElementType } from "../UI/CustomUIElements/CustomUIElementTypes";
import HoverButton from "../UI/CustomUIElements/HoverButton";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Color from "../../Wolfie2D/Utils/Color";
import Graphic from "../../Wolfie2D/Nodes/Graphic";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import SnowflakeBehavior, { SnowflakeSettings } from "../AI/SnowflakeBehavior";
import DialogueScreen from "../UI/DialogueScreen";
import { DialogueInteraction, getInteractionData } from "../GameSystems/InteractionSystem/InteractionDatabase";
import { PlayerControlMode, PlayerInput } from "../AI/Player/PlayerController";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import { AudioChannelType } from "../../Wolfie2D/Sound/AudioManager";
import StoryManager from "../GameSystems/StorySystem/StoryManager";





type AssetRef = Readonly<{
    key: string;
    path: string;
}>;

type SceneEntranceData = {
    spawnName?: string;
};

export enum TimeOfDay {
    DAY,
    NOON,
    DUSK,
    NIGHT
}

export enum WeatherType {
    NONE,
    SNOW,
    SNOWSTORM
}

type SnowPreset = Readonly<{
    poolSize: number;
    fadeInSpeed: number;
    scaleMin: number;
    scaleMax: number;
    settings: SnowflakeSettings;
}>;


export default abstract class MappedAdventureScene extends Scene {
    private static weatherAmbienceLoopsStarted = false;

    // The tilemap to load for the scene, pass from sub scenes
    protected abstract readonly tilemap: AssetRef;

    // The player to load for the scenes
    protected readonly playerSheet: AssetRef = {
        key: "fate",
        path: "game_assets/spritesheets/Fate.json"
    };

    // Sound effects
    protected readonly uiHover: AssetRef = {
        key: "ui-hover",
        path: "game_assets/sounds/ui-hover.wav"
    };

    protected readonly uiClick: AssetRef = {
        key: "ui-click",
        path: "game_assets/sounds/ui-click.wav"
    };

    protected readonly menuOpen: AssetRef = {
        key: "menu-open",
        path: "game_assets/sounds/menu-open.wav"
    };

    protected readonly menuClose: AssetRef = {
        key: "menu-close",
        path: "game_assets/sounds/menu-close.wav"
    };

    protected readonly woodenDoorSFX: AssetRef = {
        key: "door-wooden",
        path: "game_assets/sounds/door-wooden.wav"
    };

    protected readonly walkingWoodSFX: AssetRef = {
        key: "walking-wood",
        path: "game_assets/sounds/walking-wood.wav"
    };

    protected readonly walkingSnowSFX: AssetRef = {
        key: "walking-snow",
        path: "game_assets/sounds/walking-snow.wav"
    };

    protected readonly walkingSnowBushSFX: AssetRef = {
        key: "walking-snow-bush",
        path: "game_assets/sounds/walking-snow-bush.wav"
    };

    protected readonly weatherSnowInsideSFX: AssetRef = {
        key: "weather-snow-inside",
        path: "game_assets/sounds/weather-snow-inside.wav"
    };

    protected readonly weatherSnowOutsideSFX: AssetRef = {
        key: "weather-snow-outside",
        path: "game_assets/sounds/weather-snow-outside.wav"
    };

    protected readonly groundLayerName = "Ground";
    protected readonly collisionLayerName = "CollisionLayer";
    protected readonly mapBoundsLayerName = "MapBoundLayer";
    protected readonly spawnLayerName = "SpawnPoint";
    protected readonly interactablesLayerName = "Interactables";
    protected readonly actorLayerName = "Actors";
    protected readonly actorLayerDepth = 10;
    protected readonly zoomLevel = 1;
    protected readonly entranceLayerName = "Entrances";

    protected player!: PlayerActor;
    protected ground!: OrthogonalTilemap;
    protected collision!: OrthogonalTilemap;
    protected interactables: TiledObject[] = [];
    protected spawnName?: string;
    protected pauseScreen!: PauseScreen;
    protected inventoryScreen!: InventoryScreen;
    protected worldPaused: boolean = false;
    protected entrances: TiledObject[] = [];
    protected readonly storyManager = StoryManager.getInstance();

    protected dialogueScreen!: DialogueScreen;
    protected activeDialogue: DialogueInteraction | null = null;
    protected currentDialogueLine = 0;

    private timeOverlay: Graphic | null = null;
    private snowflakes: Sprite[] = [];
    private weatherActive = false;
    private weatherAlpha = 0;
    private weatherFadeInSpeed = 0.5;
    private weatherLayerCreated = false;
    private weatherLayerDepth = 50;
    private weatherAmbienceMode: "inside" | "outside" | null = null;
    private readonly weatherAmbienceFadeSeconds = 0.5;
    private readonly weatherAmbienceInitialFadeSeconds = 1.0;
    
    private readonly weatherLayerName = "weather";
    private readonly snowflakeKeys = ["snowflake1", "snowflake2", "snowflake3"];
    

    // lets the scene receive data, ex: {spawnName: "Door1"}
    public override initScene(init: SceneEntranceData = {}): void {
        this.spawnName = init?.spawnName;
    }

    public override loadScene(): void {
        this.load.tilemap(this.tilemap.key, this.tilemap.path);
        if (!this.resourceManager.getSpritesheet(this.playerSheet.key)) {
            this.load.spritesheet(this.playerSheet.key, this.playerSheet.path);
        }

        if (!this.resourceManager.getAudio(this.uiHover.key)) {
            this.load.audio(this.uiHover.key, this.uiHover.path);
        }

        if (!this.resourceManager.getAudio(this.uiClick.key)) {
            this.load.audio(this.uiClick.key, this.uiClick.path);
        }

        if (!this.resourceManager.getAudio(this.menuOpen.key)) {
            this.load.audio(this.menuOpen.key, this.menuOpen.path);
        }

        if (!this.resourceManager.getAudio(this.menuClose.key)) {
            this.load.audio(this.menuClose.key, this.menuClose.path);
        }

        if (!this.resourceManager.getAudio(this.woodenDoorSFX.key)) {
            this.load.audio(this.woodenDoorSFX.key, this.woodenDoorSFX.path);
        }

        if (!this.resourceManager.getAudio(this.walkingWoodSFX.key)) {
            this.load.audio(this.walkingWoodSFX.key, this.walkingWoodSFX.path);
        }

        if (!this.resourceManager.getAudio(this.walkingSnowSFX.key)) {
            this.load.audio(this.walkingSnowSFX.key, this.walkingSnowSFX.path);
        }

        if (!this.resourceManager.getAudio(this.walkingSnowBushSFX.key)) {
            this.load.audio(this.walkingSnowBushSFX.key, this.walkingSnowBushSFX.path);
        }

        if (!this.resourceManager.getAudio(this.weatherSnowInsideSFX.key)) {
            this.load.audio(this.weatherSnowInsideSFX.key, this.weatherSnowInsideSFX.path);
        }

        if (!this.resourceManager.getAudio(this.weatherSnowOutsideSFX.key)) {
            this.load.audio(this.weatherSnowOutsideSFX.key, this.weatherSnowOutsideSFX.path);
        }

        this.loadExtraAssets();
        
        this.add.registerCustomUIElement(CustomUIElementType.HOVER_BUTTON, (options?: Record<string, any>) => {
            return new HoverButton(options!.position, options!.text);
        });

        this.load.image("snowflake1", "game_assets/sprites/particles/Snowflake1.png");
        this.load.image("snowflake2", "game_assets/sprites/particles/Snowflake2.png");
        this.load.image("snowflake3", "game_assets/sprites/particles/Snowflake3.png");
    }

    public unloadScene(): void {
        // Keep the player's sprite
        this.load.keepSpritesheet(this.playerSheet.key);

        // Keep the sfx audio
        this.load.keepAudio(this.uiHover.key);
        this.load.keepAudio(this.uiClick.key);
        this.load.keepAudio(this.menuOpen.key);
        this.load.keepAudio(this.menuClose.key);
        this.load.keepAudio(this.woodenDoorSFX.key);
        this.load.keepAudio(this.walkingWoodSFX.key);
        this.load.keepAudio(this.walkingSnowSFX.key);
        this.load.keepAudio(this.walkingSnowBushSFX.key);
        this.load.keepAudio(this.weatherSnowInsideSFX.key);
        this.load.keepAudio(this.weatherSnowOutsideSFX.key);

        // Stop sfx when changing scenes
        this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: this.walkingWoodSFX.key});
        this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: this.walkingSnowSFX.key});
        this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: this.walkingSnowBushSFX.key});
        this.muteWeatherAmbience();
    }


    public override startScene(): void {
        this.add.tilemap(this.tilemap.key);
        this.addLayer(this.actorLayerName, this.actorLayerDepth);

        this.configureLayers();

        // =============================== Required Layers ================================
        this.ground = this.getRequiredTilemap(this.groundLayerName);
        this.collision = this.getRequiredTilemap(this.collisionLayerName);
        // ================================================================================

        const tilemapData = this.resourceManager.getTilemap(this.tilemap.key) as TiledTilemapData;
        this.spawnMapObjects(tilemapData);
        
        // =============================== Optional Layers ================================
        const spawnLayer = tilemapData.layers.find(layer => layer.name === this.spawnLayerName);
        const entranceLayer = tilemapData.layers.find(layer => layer.name === this.entranceLayerName);
        const interactLayer = tilemapData.layers.find(layer => layer.name === this.interactablesLayerName);
        // ================================================================================

        this.entrances = entranceLayer?.objects ?? [];
        this.interactables = interactLayer?.objects ?? [];

        // Spawn the Player
        const spawn = this.getSpawnObject(spawnLayer, this.spawnName);
        if (!spawn) {
            throw new Error(`SpawnPoint layer is missing or empty in map "${this.tilemap.key}"`);
        }

        this.player = this.add.animatedSprite(PlayerActor, this.playerSheet.key, this.actorLayerName);
        this.spawnPlayerAt(spawn);

        const ai = this.player.ai as PlayerAI;
        this.playIdleForFacing(ai.facing);

        this.applyCameraBounds();
        this.viewport.follow(this.player);
        this.viewport.setZoomLevel(this.zoomLevel);
        this.viewport.snapToTarget();

        // Initialize pause and inventory screens with viewport data
        this.pauseScreen = new PauseScreen(
            "pauseOverlay",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            () => this.sceneManager.changeToScene(MainMenu),
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key, onShowSFXKey: this.menuOpen.key, onHideSFXKey: this.menuClose.key }
        );
        this.inventoryScreen = new InventoryScreen(
            "inventoryOverlay",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key, onShowSFXKey: this.menuOpen.key, onHideSFXKey: this.menuClose.key }
        );
        this.dialogueScreen = new DialogueScreen(
            "dialogueOverlay",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize()
        );

        this.startWeatherAmbienceLoops();
    }

    public override updateScene(_deltaT: number): void {
        // Handle pause/resume
        if(!this.dialogueScreen.getIsOpen() && Input.isKeyJustPressed("escape")) {
            if(this.pauseScreen.getIsOpen()) {
                this.pauseScreen.hide();
            } else if(!this.inventoryScreen.getIsOpen()) {
                this.pauseScreen.show();
            }
        }

        // Handle inventory
        if (!this.dialogueScreen.getIsOpen() && Input.isKeyJustPressed("c")) {
            if(this.inventoryScreen.getIsOpen()) {
                this.inventoryScreen.hide();
            } else if(!this.pauseScreen.getIsOpen()) {
                this.inventoryScreen.show();
            }
        }

        const pauseOpen = this.pauseScreen.getIsOpen();
        const inventoryOpen = this.inventoryScreen.getIsOpen();
        const dialogueOpen = this.dialogueScreen.getIsOpen();

        const shouldPauseWorld = this.pauseScreen.getIsOpen() || this.inventoryScreen.getIsOpen();
        this.setWorldPaused(shouldPauseWorld);

        if (!pauseOpen && !inventoryOpen && dialogueOpen) {
            this.updateDialogue();
        }

        // Run gameplay interactions only while the world is not simulation-paused.
        if(!pauseOpen && !inventoryOpen && !dialogueOpen) {
            const ai = this.player.ai as PlayerAI;
            const controller = ai.controller;

            if (ai.targetTile) {
                const entrance = this.findObjectAtTile(this.entrances, ai.targetTile);
                if (entrance) {
                    this.handleAutoTransition(entrance);
                }
            }
            

            if (!ai.moving && controller.interacting) {
                const currentHit = this.findInteractableAtTile(ai.currentTile);
                // Checks current tile first
                if (currentHit) {
                    console.log("[Interacted with:", currentHit.name, "]");
                    this.handleInteraction(currentHit);
                    return;
                }

                const nextTile = ai.currentTile.clone().add(ai.facing);
                const nextHit = this.findInteractableAtTile(nextTile);
                // Checks destination tile next
                if (nextHit) {
                    console.log("[Interacted with:", nextHit.name, "]");
                    this.handleInteraction(nextHit);
                }
            }
        }

        if (this.weatherActive && this.weatherAlpha < 1) {
            this.weatherAlpha = Math.min(this.weatherAlpha + _deltaT * this.weatherFadeInSpeed, 1);
            for (const flake of this.snowflakes) {
                flake.alpha = this.weatherAlpha;
            }
        }

        this.syncWeatherAmbience();
    }

    protected setWorldPaused(paused: boolean): void {
        if (this.worldPaused === paused) {
            return;
        }

        this.worldPaused = paused;

        this.layers.forEach((name: string) => {
            this.layers.get(name).setPaused(paused);
        });

        this.parallaxLayers.forEach((name: string) => {
            this.parallaxLayers.get(name).setPaused(paused);
        });
    }

    protected override isSimulationPaused(): boolean {
        return this.worldPaused;
    }
    
    protected loadExtraAssets(): void {}

    protected configureLayers(): void {}

    protected spawnMapObjects(_tilemapData: TiledTilemapData): void {}

    protected handleInteraction(_obj: TiledObject): void {}

    protected handleAutoTransition(_obj: TiledObject): void {}

    /**
     * Override in child scenes if weather ambience should default indoors.
     * This can later be made dynamic (e.g. based on player tile inside a room volume).
     */
    protected isWeatherAmbienceIndoors(): boolean {
        return false;
    }

    protected syncWeatherAmbience(): void {
        if (!this.weatherActive) {
            this.muteWeatherAmbience(this.weatherAmbienceFadeSeconds);
            return;
        }

        const fadeSeconds = this.weatherAmbienceMode === null
            ? this.weatherAmbienceInitialFadeSeconds
            : this.weatherAmbienceFadeSeconds;

        this.setWeatherAmbience(this.isWeatherAmbienceIndoors(), fadeSeconds);
    }

    protected startWeatherAmbienceLoops(): void {
        if (MappedAdventureScene.weatherAmbienceLoopsStarted) {
            return;
        }

        MappedAdventureScene.weatherAmbienceLoopsStarted = true;

        // Start weather ambience stems once and keep them running across mapped scenes.
        this.emitter.fireEvent(GameEventType.PLAY_SFX, {
            key: this.weatherSnowInsideSFX.key,
            loop: true,
            holdReference: true,
            channel: AudioChannelType.CUSTOM_1,
            fadeInSeconds: this.weatherAmbienceInitialFadeSeconds
        });

        this.emitter.fireEvent(GameEventType.PLAY_SFX, {
            key: this.weatherSnowOutsideSFX.key,
            loop: true,
            holdReference: true,
            channel: AudioChannelType.CUSTOM_2,
            fadeInSeconds: this.weatherAmbienceInitialFadeSeconds
        });
    }

    /**
     * Crossfades between indoor and outdoor weather ambience channels.
     * Uses channel-level fades so both weather stems stay phase-synced.
     */
    protected setWeatherAmbience(indoor: boolean, fadeSeconds: number = 0.35): void {
        const nextMode: "inside" | "outside" = indoor ? "inside" : "outside";
        if (this.weatherAmbienceMode === nextMode) {
            return;
        }

        this.weatherAmbienceMode = nextMode;

        const indoorEvent = {
            channel: AudioChannelType.CUSTOM_1,
            fadeSeconds
        };
        const outdoorEvent = {
            channel: AudioChannelType.CUSTOM_2,
            fadeSeconds
        };

        if (indoor) {
            this.emitter.fireEvent(GameEventType.UNMUTE_CHANNEL, indoorEvent);
            this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, outdoorEvent);
        } else {
            this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, indoorEvent);
            this.emitter.fireEvent(GameEventType.UNMUTE_CHANNEL, outdoorEvent);
        }
    }

    /**
     * Mutes both weather ambience channels and clears the current ambience state.
     */
    protected muteWeatherAmbience(fadeSeconds: number = 0): void {
        this.weatherAmbienceMode = null;
        this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, {
            channel: AudioChannelType.CUSTOM_1,
            fadeSeconds
        });
        this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, {
            channel: AudioChannelType.CUSTOM_2,
            fadeSeconds
        });
    }

    /**
     * Retrieves a tile layer by name and throws an error if it is missing.
     * Use this for map layers that every scene is expected to have.
     * @param name The name of the required tile layer.
     * @returns The matching tilemap.
     */
    protected getRequiredTilemap(name: string): OrthogonalTilemap {
        const tilemap = this.getTilemap(name) as OrthogonalTilemap | null;
        if (!tilemap) {
            throw new Error(`Required tile layer "${name}" is missing in map "${this.tilemap.key}"`);
        }
        return tilemap;
    }

    /**
     * Finds the spawn object to use from the given spawn layer.
     * If a spawn name is provided, it tries to find a matching named spawn first.
     * Otherwise, it falls back to the first object in the layer.
     * @param spawnLayer The already-found SpawnPoint object layer.
     * @param spawnName The optional spawn object name to search for.
     * @returns The selected spawn object, or undefined if the layer has no objects.
     */
    protected getSpawnObject(spawnLayer: TiledLayerData | undefined, spawnName?: string ): TiledObject | undefined {
        if (!spawnLayer?.objects?.length) {
            return undefined;
        }

        if (spawnName) {
            const namedSpawn = spawnLayer.objects.find(obj => obj.name === spawnName);
            if (namedSpawn) {
                return namedSpawn;
            }
        }

        return spawnLayer.objects[0];
    }


    protected playIdleForFacing(facing: Vec2): void {
        if (facing.y < 0) {
            this.player.animation.play("IDLE_UP", true);
        } else if (facing.y > 0) {
            this.player.animation.play("IDLE_DOWN", true);
        } else if (facing.x < 0) {
            this.player.animation.play("IDLE_LEFT", true);
        } else if (facing.x > 0) {
            this.player.animation.play("IDLE_RIGHT", true);
        } else {
            this.player.animation.play("IDLE_DOWN", true);
        }
    }
    


    /**
     * Returns the tile containing the center of the given Tiled object.
     * Mainly used for point objects such as spawns and markers.
     */
    protected getObjectTile(obj: TiledObject): Vec2 {
        return this.ground.getTilemapPosition(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2
        );
    }


    /**
     * Returns the rectangle covered by a Tiled object in world coordinates.
     * @param obj The Tiled object to convert.
     * @returns An AABB matching the object's rectangular bounds.
     */
    protected getObjectBounds(obj: TiledObject): AABB {
        return new AABB(
            new Vec2(obj.x + obj.width / 2, obj.y + obj.height / 2),
            new Vec2(obj.width / 2, obj.height / 2)
        );
    }

    /**
     * Checks whether a Tiled object occupies the queried tile.
     * Rectangle objects are matched against the tile center point; point objects
     * fall back to their tile coordinate so spawn markers and similar objects keep
     * working as expected.
     * @param obj The Tiled object to test.
     * @param tile The tile to query.
     * @returns True if the object should be considered present on that tile.
     */
    protected objectOccupiesTile(obj: TiledObject, tile: Vec2): boolean {
        if (obj.width === 0 && obj.height === 0) {
            const objTile = this.getObjectTile(obj);
            return objTile.x === tile.x && objTile.y === tile.y;
        }

        return this.getObjectBounds(obj).containsPointSoft(
            this.ground.getTileCenter(tile.x, tile.y)
        );
    }

    /**
     * Finds the first object in the provided collection that occupies the given tile.
     * @param objects The objects to search.
     * @param tile The tile coordinate to query.
     * @returns The first matching object, or undefined if none occupy that tile.
     */
    protected findObjectAtTile(objects: TiledObject[], tile: Vec2): TiledObject | undefined {
        return objects.find(obj => this.objectOccupiesTile(obj, tile));
    }

    // Returns the time-of-day overlay color for this scene.
    // Return null for no overlay (default).
    protected setTimeOfDay(time: TimeOfDay): void {
        const color = this.getColorForTime(time);
        if (!color) {
            if (this.timeOverlay) {
                this.timeOverlay.visible = false;
            }
            return;
        }
        if (!this.timeOverlay) {
            this.addParallaxLayer("timeOverlay", Vec2.ZERO, 9999);
            const half = this.viewport.getHalfSize();
            this.timeOverlay = this.add.graphic(GraphicType.RECT, "timeOverlay", {
                position: half.clone(),
                size: half.scaled(2)
            });
        }
        this.timeOverlay.color = color;
        this.timeOverlay.visible = true;
    }

    protected setWeather(weather: WeatherType, layerDepth: number = this.weatherLayerDepth): void {
        if (weather === WeatherType.NONE) {
            for (const flake of this.snowflakes) {
                flake.visible = false;
            }
            this.weatherActive = false;
            this.muteWeatherAmbience(this.weatherAmbienceFadeSeconds);
            return;
        }
    
        const preset = this.getSnowPreset(weather);
        this.weatherLayerDepth = layerDepth;
        this.weatherFadeInSpeed = preset.fadeInSpeed;
    
        this.ensureWeatherLayer();
        this.getLayer(this.weatherLayerName).setDepth(this.weatherLayerDepth);
        this.ensureSnowPool(preset);
    
        this.weatherAlpha = 0;
    
        for (let i = 0; i < this.snowflakes.length; i++) {
            const flake = this.snowflakes[i];
    
            if (i < preset.poolSize) {
                const scale = preset.scaleMin + Math.random() * (preset.scaleMax - preset.scaleMin);
    
                flake.visible = true;
                flake.alpha = 0;
                flake.scale.set(scale, scale);
    
                (flake.ai as SnowflakeBehavior).activate({ settings: preset.settings });
                (flake.ai as SnowflakeBehavior).scatterOnScreen();
            } else {
                flake.visible = false;
            }
        }
    
        this.weatherActive = true;
        this.syncWeatherAmbience();
    }
    
    private ensureWeatherLayer(): void {
        if (!this.weatherLayerCreated) {
            this.addLayer(this.weatherLayerName, this.weatherLayerDepth);
            this.weatherLayerCreated = true;
        }
    }
    
    private ensureSnowPool(preset: SnowPreset): void {
        this.ensureWeatherLayer();
    
        while (this.snowflakes.length < preset.poolSize) {
            const key = this.snowflakeKeys[this.snowflakes.length % this.snowflakeKeys.length];
            const flake = this.add.sprite(key, this.weatherLayerName);
    
            flake.visible = false;
            flake.addAI(SnowflakeBehavior, {
                viewport: this.viewport,
                settings: preset.settings
            });
    
            this.snowflakes.push(flake);
        }
    }
    
    private getSnowPreset(weather: WeatherType): SnowPreset {
        switch (weather) {
            case WeatherType.SNOW:
                return {
                    poolSize: 80,
                    fadeInSpeed: 0.35,
                    scaleMin: 0.28,
                    scaleMax: 0.5,
                    settings: {
                        spawnPadding: 96,
                        recyclePadding: 128,
                        inflowEpsilon: 5,
                        baseSpeedMin: 25,
                        baseSpeedMax: 55,
                        angleMinDegrees: 5,
                        angleMaxDegrees: 12,
                        wobbleAmplitudeMin: 3,
                        wobbleAmplitudeMax: 10,
                        wobbleFrequencyMin: 0.4,
                        wobbleFrequencyMax: 1.1
                    }
                };
    
            case WeatherType.SNOWSTORM:
                return {
                    poolSize: 340,
                    fadeInSpeed: 0.75,
                    scaleMin: 0.48,
                    scaleMax: 1.00,
                    settings: {
                        spawnPadding: 128,
                        recyclePadding: 160,
                        inflowEpsilon: 5,
                        baseSpeedMin: 130,
                        baseSpeedMax: 400,
                        angleMinDegrees: 28,
                        angleMaxDegrees: 62,
                        wobbleAmplitudeMin: 14,
                        wobbleAmplitudeMax: 56,
                        wobbleFrequencyMin: 0.9,
                        wobbleFrequencyMax: 2.1
                    }
                };
    
            default:
                throw new Error(`Weather preset not defined for weather type "${weather}"`);
        }
    }
    

    private getColorForTime(time: TimeOfDay): Color | null {
        switch (time) {
            case TimeOfDay.DAY:  return null;
            case TimeOfDay.NOON:  return new Color(200, 140, 60, 0.30);
            case TimeOfDay.DUSK:  return new Color(30, 20, 60, 0.45);
            case TimeOfDay.NIGHT: return new Color(10, 10, 60, 0.75);
            default:              return null;
        }
    }

    /**
     * Places the player at the given spawn object and initializes PlayerAI with the correct start tile.
     * The player is positioned using feet alignment so the sprite stands correctly on the grid.
     * @param spawn The Tiled object that marks where the player should appear.
     */
    protected spawnPlayerAt(spawn: TiledObject): void {
        const spawnTile = this.getObjectTile(spawn);
        const tileCenter = this.ground.getTileCenter(spawnTile.x, spawnTile.y);

        this.player.position.copy(
            this.player.getCenterForFeetPosition(tileCenter.x, tileCenter.y)
        );
        this.player.setSortTile(spawnTile);
        this.player.setSortOrder(0);
        this.player.addAI(PlayerAI, { startTile: spawnTile, tilemap: this.collision });

        const ai = this.player.ai as PlayerAI;
        const facingProp = spawn.properties?.find(prop => prop.name === "facing")?.value;

        if (facingProp === "up") {
            ai.facing = Vec2.UP;
        } else if (facingProp === "down") {
            ai.facing = Vec2.DOWN;
        } else if (facingProp === "left") {
            ai.facing = Vec2.LEFT;
        } else if (facingProp === "right") {
            ai.facing = Vec2.RIGHT;
        }
    }


    /**
     * Sets the viewport bounds from the map's bounds layer so the camera stays inside the playable area.
     * Falls back to the full ground tilemap size if no bounds layer exists or if it has no painted tiles.
     */
    protected applyCameraBounds(): void {
        const mapBounds = this.getTilemap(this.mapBoundsLayerName) as OrthogonalTilemap | null;

        if (!mapBounds) {
            this.viewport.setBounds(0, 0, this.ground.size.x, this.ground.size.y);
            return;
        }

        const dims = mapBounds.getDimensions();
        const tileSize = mapBounds.getScaledTileSize();

        let minCol = dims.x;
        let minRow = dims.y;
        let maxCol = -1;
        let maxRow = -1;

        for (let row = 0; row < dims.y; row++) {
            for (let col = 0; col < dims.x; col++) {
                if (mapBounds.getTile(col, row) !== 0) {
                    minCol = Math.min(minCol, col);
                    minRow = Math.min(minRow, row);
                    maxCol = Math.max(maxCol, col);
                    maxRow = Math.max(maxRow, row);
                }
            }
        }

        if (maxCol < 0 || maxRow < 0) {
            this.viewport.setBounds(0, 0, this.ground.size.x, this.ground.size.y);
            return;
        }

        const topLeft = mapBounds.getWorldPosition(minCol, minRow);
        const bottomRight = mapBounds.getWorldPosition(maxCol, maxRow);

        this.viewport.setBounds(
            topLeft.x,
            topLeft.y,
            bottomRight.x + tileSize.x,
            bottomRight.y + tileSize.y
        );
    }

    /**
     * Finds the first interactable object whose bounds contain the given tile center.
     * @param tile The tile coordinate to check for an interactable object.
     * @returns The matching interactable object, or undefined if no interactable is on that tile.
     */
    protected findInteractableAtTile(tile: Vec2): TiledObject | undefined {
        return this.findObjectAtTile(this.interactables, tile);
    }

    protected getInteractionId(obj: TiledObject): string {
        const customId = obj.properties?.find(prop => prop.name === "interactionId")?.value;
    
        if (typeof customId === "string" && customId.length > 0) {
            return customId;
        }
    
        if (obj.type && obj.type.length > 0) {
            return obj.type;
        }
    
        return obj.name;
    }
    
    protected tryStartInteractionDialogue(obj: TiledObject): boolean {
        const interactionId = this.getInteractionId(obj);
        const interaction = getInteractionData(interactionId);
    
        if (!interaction || interaction.type !== "dialogue") {
            return false;
        }
    
        this.startDialogue(interaction);
        return true;
    }

    protected startDialogue(dialogue: DialogueInteraction): void {
        const ai = this.player.ai as PlayerAI;
        ai.controller.setControlMode(PlayerControlMode.DIALOGUE);

        this.activeDialogue = dialogue;
        this.currentDialogueLine = 0;

        this.dialogueScreen.showLine(dialogue.lines[this.currentDialogueLine]);
    }
    
    protected updateDialogue(): void {
        if (!this.activeDialogue) {
            return;
        }
    
        if (!Input.isJustPressed(PlayerInput.INTERACT)) {
            return;
        }
    
        if (this.dialogueScreen.isTyping()) {
            this.dialogueScreen.revealCurrentLine();
            return;
        }
    
        this.currentDialogueLine += 1;
    
        if (this.currentDialogueLine >= this.activeDialogue.lines.length) {
            this.endDialogue();
            return;
        }
    
        this.dialogueScreen.showLine(
            this.activeDialogue.lines[this.currentDialogueLine]);
    }
    
    protected endDialogue(): void {
        const ai = this.player.ai as PlayerAI;
        ai.controller.setControlMode(PlayerControlMode.GAMEPLAY);

        this.activeDialogue = null;
        this.currentDialogueLine = 0;
        this.dialogueScreen.hide();
    }

    public playUIClickSFX(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SFX, {key: this.uiClick.key, loop: false, holdReference: false});
    }

    public playDialogueSFX(): void {
        return; // Placeholder for now, can be used for dialogue-specific sound effects in the future
    }
    
    // TEMPORARY function to determine ground type for sfx purposes, ideally this would be determined by properties on the tilemap
    public groundTypeAtTile(tile: Vec2): "snow" | "wood" | "bush" | null {
        const tilemapData = this.resourceManager.getTilemap(this.tilemap.key) as TiledTilemapData;
        if (!tilemapData) {
            return null;
        }

        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables")
        const bushPoints = interactLayer?.objects.filter(obj => obj.name === "BushBerries") ?? [];
        if (bushPoints.some(bush => {
            const bushTile = this.getObjectTile(bush);
            return bushTile.x === tile.x && bushTile.y === tile.y;
        })) {
            return "bush";
        }

        return this.tilemap.key === "chapter1" ? "snow" : this.tilemap.key === "shelter" ? "wood" : null;
    }

    // TEMPORARY function to get asset keys from the scene
    public getAssetKey(assetName: string): string {
        switch (assetName) {
            case "tilemap":
                return this.tilemap.key;
            case "woodenDoorSFX":
                return this.woodenDoorSFX.key;
            case "walkingWoodSFX":
                return this.walkingWoodSFX.key;
            case "walkingSnowSFX":
                return this.walkingSnowSFX.key;
            case "walkingSnowBushSFX":
                return this.walkingSnowBushSFX.key;
            default:
                return "invalid asset name";
        }
    }
}
