import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import { TiledObject, TiledTilemapData, TiledLayerData} from "../../Wolfie2D/DataTypes/Tilesets/TiledData";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Scene from "../../Wolfie2D/Scene/Scene";
import PlayerActor from "../Actors/PlayerActor";
import PlayerAI from "../AI/Player/PlayerAI";
import PauseScreen from "../UI/PauseScreen";
import InventoryScreen from "../UI/InventoryScreen";
import MainMenu from "./MainMenu";
import { CustomUIElementType } from "../UI/CustomUIElements/CustomUIElementTypes";
import HoverButton from "../UI/CustomUIElements/HoverButton";
import UIImage from "../UI/CustomUIElements/UIImage";
import { PlayerControlMode, PlayerInput } from "../AI/Player/PlayerController";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import { DialogueChoiceAction, DialogueChoiceOption, DialogueInteraction, DialogueCompleteAction, getInteractionData } from "../GameSystems/InteractionSystem/InteractionDatabase";
import PlayerStateManager from "../GameSystems/PlayerSystem/PlayerStateManager";
import GameSessionManager from "../GameSystems/GameSessionSystem/GameSessionManager";
import InventoryItem from "../GameSystems/ItemSystem/InventoryItem";
import { UIScreenActionBindings } from "../UI/UIScreen";
import WeatherController from "../GameSystems/WorldSystem/WeatherController";
import SpotlightOverlay from "../UI/CustomUIElements/SpotlightOverlay";
import DialogueController, { DialogueStartOptions } from "../GameSystems/DialogueController";
import TimeController from "../GameSystems/WorldSystem/TimeController";
import CameraController from "../GameSystems/CameraController";
import { ItemUseAction, ItemUseResult } from "../GameSystems/ItemSystem/ItemUseActions";
import { PlayerStateType } from "../AI/Player/PlayerStates/PlayerBehaviorState";
import { WeatherType } from "../GameSystems/WorldSystem/WorldState";
import PauseControlsScreen from "../UI/PauseControlsScreen";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";


export type AssetRef = Readonly<{
    readonly key: string;
    readonly path: string;
}>;

type SceneEntranceData = {
    cheatsEnabled?: boolean;
    spawnName?: string;
};

type ScriptedTileMoveOptions = {
    ignoreCollision?: boolean;
};

export interface ChapterSceneDefinition {
    dialogueCompleteActionHandlers: Readonly<Partial<Record<DialogueCompleteAction, () => void>>>;
    dialogueChoiceActionHandlers: Readonly<Partial<Record<DialogueChoiceAction, () => void>>>;
}

export type AssetManifest = Record<string, AssetRef>;

export type AssetBundle = {
    tilemaps: AssetManifest;
    spritesheets: AssetManifest;
    sprites: AssetManifest;
    sounds: AssetManifest;
    [category: string]: AssetManifest | undefined;
};


export default abstract class MappedAdventureScene extends Scene {
    protected worldTimeScale = 1;
    protected interactIcon!: AnimatedSprite;
    protected readonly interactIconOffsetX = 5;
    protected readonly interactIconOffsetY = -60;
    protected readonly interactIconScale = 1.6;
    protected readonly interactIconLayerName = "InteractIcon";


    // The tilemap to load for the scene, pass from sub scenes
    protected abstract readonly tilemap: AssetRef;

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {
            playerSheet: { key: "fate", path: "/assets/spritesheets/Fate.json" },
            interactIcon: { key: "interactIcon", path: "/assets/spritesheets/InteractIcon.json" }
        },
        sprites: {
            snowflake1Sprite: { key: "snowflake1", path: "/assets/sprites/particles/Snowflake1.png" },
            snowflake2Sprite: { key: "snowflake2", path: "/assets/sprites/particles/Snowflake2.png" },
            snowflake3Sprite: { key: "snowflake3", path: "/assets/sprites/particles/Snowflake3.png" }
        },
        sounds: {
            uiHoverSFX: { key: "ui-hover", path: "/assets/sounds/ui-hover.ogg" },
            uiClickSFX: { key: "ui-click", path: "/assets/sounds/ui-click.ogg" },
            menuOpenSFX: { key: "menu-open", path: "/assets/sounds/menu-open.ogg" },
            menuCloseSFX: { key: "menu-close", path: "/assets/sounds/menu-close.ogg" },
            dialogueSpeakingSFX: { key: "dialogue-speaking-male", path: "/assets/sounds/dialogue-speaking-male.ogg" },
            dialogueNextSFX: { key: "dialogue-next", path: "/assets/sounds/dialogue-next.ogg" },
            itemReceivedSFX: { key: "item-received", path: "/assets/sounds/item-received.ogg" },
            walkingDirtSFX: { key: "walking-dirt", path: "/assets/sounds/walking-dirt.ogg" },
            woodenDoorSFX: { key: "door-wooden", path: "/assets/sounds/door-wooden.ogg" }
        }
    };

    protected assets: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {},
        sounds: {}
    }; 
    
    protected abstract readonly chapterDefinition: ChapterSceneDefinition;

    protected readonly gameSessionManager = GameSessionManager.getInstance();
    protected readonly playerStateManager = PlayerStateManager.getInstance();

    protected readonly groundLayerName = "Ground";
    protected readonly collisionLayerName = "CollisionLayer";
    protected readonly mapBoundsLayerName = "MapBoundLayer";
    protected readonly spawnLayerName = "SpawnPoint";
    protected readonly interactablesLayerName = "Interactables";
    protected readonly actorLayerName = "Actors";
    protected readonly actorLayerDepth = 10;
    protected readonly entranceLayerName = "Entrances";

    protected player!: PlayerActor;
    protected ground!: OrthogonalTilemap;
    protected collision!: OrthogonalTilemap;
    protected interactables: TiledObject[] = [];
    protected cheatsEnabled: boolean = false;
    protected spawnName?: string;
    protected entrances: TiledObject[] = [];
    protected transitioning = false;

    protected pauseScreen!: PauseScreen;
    protected pauseControlsScreen!: PauseControlsScreen;
    protected inventoryScreen!: InventoryScreen;
    protected worldPaused: boolean = false;
    
    protected cameraController!: CameraController;
    protected dialogueController!: DialogueController;
    protected timeController!: TimeController;
    protected weatherController!: WeatherController;
    
    // lets the scene receive data, ex: {spawnName: "Door1"}
    public override initScene(init: SceneEntranceData = {}): void {
        this.cheatsEnabled = init?.cheatsEnabled ?? false;
        this.spawnName = init?.spawnName;
        this.assets = this.combinedAssetBundles();
    }

    public override loadScene(): void {
        // Load only base assets here
        this.loadAssets(this.assets);
        
        this.add.registerCustomUIElement(CustomUIElementType.HOVER_BUTTON, (options?: Record<string, any>) => {
            return new HoverButton(options!.position, options!.text);
        });

        this.add.registerCustomCanvasNode(CustomUIElementType.UI_IMAGE, (options?: Record<string, any>) => {
            return new UIImage(options!.imageKey);
        });

        this.add.registerCustomCanvasNode(CustomUIElementType.SPOTLIGHT_OVERLAY, (options?: Record<string, any>) => {
            return new SpotlightOverlay(options!.position, options!.size, options!.radius, options!.innerRadiusRatio, options!.overlayColor);
        });

    }

    public unloadScene(): void {
        this.keepAssets(MappedAdventureScene.assetBundle);
        this.weatherController.muteWeatherAmbience();
        this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: this.assets.sounds.walkingDirtSFX.key});
    }

    protected mergeAssetBundles(parent: AssetBundle, child: AssetBundle): AssetBundle {
        return {
            tilemaps: { ...(parent.tilemaps ?? {}), ...(child.tilemaps ?? {}) },
            spritesheets: { ...(parent.spritesheets ?? {}), ...(child.spritesheets ?? {}) },
            sprites: { ...(parent.sprites ?? {}), ...(child.sprites ?? {}) },
            sounds: { ...(parent.sounds ?? {}), ...(child.sounds ?? {}) }
        };
    }
    
    protected combinedAssetBundles(): AssetBundle {
        return MappedAdventureScene.assetBundle;
    }

    protected assetBundleToKeyArrays(bundle: AssetBundle): {
        tilemaps: ReadonlyArray<AssetRef>;
        spritesheets: ReadonlyArray<AssetRef>;
        sprites: ReadonlyArray<AssetRef>;
        sounds: ReadonlyArray<AssetRef>
    } {
        const tilemaps = Object.values(bundle.tilemaps ?? {});
        const spritesheets = Object.values(bundle.spritesheets ?? {});
        const sprites = Object.values(bundle.sprites ?? {});
        const sounds = Object.values(bundle.sounds ?? {});
        return {tilemaps, spritesheets, sprites, sounds};
    }
    
    protected loadAssets(assets: AssetBundle): void {
        const { tilemaps, spritesheets, sprites, sounds } = this.assetBundleToKeyArrays(assets);

        tilemaps
            .filter(tilemap => !this.resourceManager.getTilemap(tilemap.key))
            .forEach(tilemap => this.load.tilemap(tilemap.key, tilemap.path));
        spritesheets
            .filter(spritesheet => !this.resourceManager.getSpritesheet(spritesheet.key))
            .forEach(spritesheet => this.load.spritesheet(spritesheet.key, spritesheet.path));
        sprites
            .filter(sprite => !this.resourceManager.getImage(sprite.key))
            .forEach(sprite => this.load.image(sprite.key, sprite.path));
        sounds
            .filter(sound => !this.resourceManager.getAudio(sound.key))
            .forEach(sound => this.load.audio(sound.key, sound.path));
    }

    protected keepAssets(assets: AssetBundle): void {
        const { tilemaps, spritesheets, sprites, sounds } = this.assetBundleToKeyArrays(assets);

        tilemaps.forEach(tilemap => {this.load.keepTilemap(tilemap.key)});
        spritesheets.forEach(spritesheet => {this.load.keepSpritesheet(spritesheet.key)});
        sprites.forEach(sprite => {this.load.keepImage(sprite.key)});
        sounds.forEach(sound => {this.load.keepAudio(sound.key)});
    }

    public override startScene(): void {
        this.gameSessionManager.requireCurrentSession();

        this.add.tilemap(this.tilemap.key);
        this.addLayer(this.actorLayerName, this.actorLayerDepth);
        this.addLayer(this.interactIconLayerName, this.actorLayerDepth + 1);


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
        this.transitioning = false;
        this.interactables = interactLayer?.objects ?? [];

        // Spawn the Player
        const spawn = this.getSpawnObject(spawnLayer, this.spawnName);
        if (!spawn) {
            throw new Error(`SpawnPoint layer is missing or empty in map "${this.tilemap.key}"`);
        }

        this.player = this.add.animatedSprite(PlayerActor, this.assets.spritesheets.playerSheet.key, this.actorLayerName);
        this.player.sceneAssets = this.assets;

        const playerState = this.playerStateManager.getPlayerState();
        this.player.maxHealth = playerState.maxHealth;
        this.player.health = playerState.health;

        this.spawnPlayerAt(spawn);

        this.interactIcon = this.add.animatedSprite(
            AnimatedSprite,
            this.assets.spritesheets.interactIcon.key,
            this.interactIconLayerName
        );
        
        this.interactIcon.animation.play("IDLE", true);
        this.interactIcon.visible = false;
        this.interactIcon.scale.set(this.interactIconScale, this.interactIconScale);
        this.interactIcon.setSortOrder(100);

        const ai = this.player.ai as PlayerAI;
        const controller = ai.controller;
        this.playIdleForFacing(ai.facing);

        const uiActions: UIScreenActionBindings = {
            navigatePrevious: () => controller.isJustPressed(PlayerInput.MOVE_LEFT) || controller.isJustPressed(PlayerInput.MOVE_UP),
            navigateNext: () => controller.isJustPressed(PlayerInput.MOVE_RIGHT) || controller.isJustPressed(PlayerInput.MOVE_DOWN),
            confirm: () => controller.isJustPressed(PlayerInput.INTERACT)
        };

        // Initialize pause and inventory screens with viewport data
        this.pauseScreen = new PauseScreen(
            "pauseOverlay",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            () => { this.pauseScreen?.hide(); this.pauseControlsScreen?.show() },
            () => this.sceneManager.changeToScene(MainMenu),
            {
                onEnterSFXKey: this.assets.sounds.uiHoverSFX.key,
                onClickSFXKey: this.assets.sounds.uiClickSFX.key,
                onShowSFXKey: this.assets.sounds.menuOpenSFX.key,
                onHideSFXKey: this.assets.sounds.menuCloseSFX.key,
                uiActions
            }
        );

        this.pauseControlsScreen = new PauseControlsScreen(
            "pauseControlsOverlay",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            () => { this.pauseControlsScreen?.hide(); this.pauseScreen?.show() },
            { onEnterSFXKey: this.assets.sounds.uiHoverSFX.key, onClickSFXKey: this.assets.sounds.uiClickSFX.key, uiActions }
        );

        this.inventoryScreen = new InventoryScreen(
            "inventoryOverlay",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            playerState.inventory,
            (item: InventoryItem) => this.consumeInventoryItem(item),
            {
                onEnterSFXKey: this.assets.sounds.uiHoverSFX.key,
                onClickSFXKey: this.assets.sounds.uiClickSFX.key,
                onShowSFXKey: this.assets.sounds.menuOpenSFX.key,
                onHideSFXKey: this.assets.sounds.menuCloseSFX.key,
                uiActions
            }
        );

        const worldState = this.gameSessionManager.getWorldState();

        this.dialogueController = new DialogueController(
            this,
            this.viewport,
            this.player,
            (option: DialogueInteraction) => {
                this.handleDialogueCompleteAction(option);
            },
            (option: DialogueChoiceOption) => {
                this.handleDialogueChoiceAction(option);
            },
            {
                onEnterSFXKey: this.assets.sounds.uiHoverSFX.key,
                onClickSFXKey: this.assets.sounds.uiClickSFX.key,
                uiActions
            }
        );

        this.cameraController = new CameraController(this, this.viewport, this.player, this.ground, this.actorLayerName);
        
        this.dialogueController.sceneAssets = this.assets;

        this.timeController = new TimeController(this, this.viewport, this.player);
        this.timeController.setTimeOfDay(worldState.timeOfDay);

        this.weatherController = new WeatherController(this, this.viewport);
        this.weatherController.sceneAssets = this.assets;
        this.weatherController.setWeather(WeatherType.NONE);
    }

    public override updateScene(deltaT: number): void {
        const ai = this.player.ai as PlayerAI;
        const controller = ai.controller;
        const pauseOpen = this.pauseScreen.getIsOpen() || this.pauseControlsScreen.getIsOpen();
        const inventoryOpen = this.inventoryScreen.getIsOpen();
        const dialogueOpen = this.dialogueController.isActive;
        const menuOpen = pauseOpen || inventoryOpen || dialogueOpen;
        const shouldPauseWorld = pauseOpen || inventoryOpen;
        this.setWorldPaused(shouldPauseWorld);

        let menuSafetyFlag = false;
        // Handle pause/resume
        if(!menuSafetyFlag && !dialogueOpen && controller.isJustPressed(PlayerInput.PAUSE)) {
            if (pauseOpen) {
                this.pauseScreen.hide();
                this.pauseControlsScreen.hide();
            } else if(!inventoryOpen) {
                this.pauseScreen.show();
            }
            menuSafetyFlag = true;
        }

        // Handle inventory
        if (!menuSafetyFlag && !dialogueOpen && controller.isJustPressed(PlayerInput.INVENTORY)) {
            if (inventoryOpen) {
                this.inventoryScreen.hide();
            } else if(!pauseOpen) {
                this.inventoryScreen.show();
            }
            menuSafetyFlag = true;
        }

        this.pauseScreen.update(deltaT);
        this.pauseControlsScreen.update(deltaT);
        this.inventoryScreen.update(deltaT);
        
        this.cameraController.update(deltaT);
        this.dialogueController.update(deltaT);
        this.timeController.update(deltaT);
        this.weatherController.update(deltaT);

        this.updateInteractIcon();

        // Run gameplay interactions only while the world is not simulation-paused.
        if(!menuOpen) {
            if (ai.targetTile) {
                const entrance = this.findObjectAtTile(this.entrances, ai.targetTile);
                if (entrance) {
                    if (!this.transitioning) {
                        this.transitioning = true;
                        this.handleAutoTransition(entrance);
                    }
                }
            }
            
            if (!ai.moving && controller.interacting) {
                const nextTile = ai.currentTile.clone().add(ai.facing);
            
                if (this.tryStartSceneInteractionAtTile(ai.currentTile)) {
                    return;
                }
            
                if (this.tryStartSceneInteractionAtTile(nextTile)) {
                    return;
                }
            
                const currentHit = this.findInteractableAtTile(ai.currentTile);
                if (currentHit) {
                    console.log("[Interacted with:", currentHit.name, "]");
                    this.handleInteraction(currentHit);
                    return;
                }
            
                const nextHit = this.findInteractableAtTile(nextTile);
                if (nextHit) {
                    console.log("[Interacted with:", nextHit.name, "]");
                    this.handleInteraction(nextHit);
                }
            }
        }
    }

    private updateInteractIcon(): void {
        // hide when dialogue is active
        if (this.dialogueController?.isActive) {
            this.interactIcon.visible = false;
            return;
        }

        const ai = this.player.ai as PlayerAI;
    
        const facingTile = ai.currentTile.clone().add(ai.facing);

        const shouldShow =
            !!this.findInteractableAtTile(ai.currentTile) ||
            !!this.findInteractableAtTile(facingTile) ||
            (ai.targetTile !== null && !!this.findInteractableAtTile(ai.targetTile));
        
    
        this.interactIcon.visible = shouldShow;
    
        if (!shouldShow) {
            return;
        }
    
        this.interactIcon.position.set(
            this.player.position.x + this.interactIconOffsetX,
            this.player.position.y
                - this.player.size.y / 2
                - (this.interactIcon.size.y * this.interactIcon.scale.y) / 2
                - this.interactIconOffsetY
        );
    
        this.interactIcon.setSortTile(this.player.getSortTile());
        this.interactIcon.setSortOrder(100);
    }
    

    protected override getSimulationTimeScale(): number {
        return this.worldTimeScale;
    }

    protected setWorldTimeScale(scale: number): void {
        this.worldTimeScale = Math.max(0, scale);
    }

    protected lockPlayerInput(): void {
        const ai = this.player.ai as PlayerAI;
        ai.controller.setControlMode(PlayerControlMode.LOCKED);
    }

    protected unlockPlayerInput(): void {
        const ai = this.player.ai as PlayerAI;
        ai.controller.setControlMode(PlayerControlMode.GAMEPLAY);
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

    protected tryStartSceneInteractionAtTile(_tile: Vec2): boolean {
        return false;
    }

    protected override isSimulationPaused(): boolean {
        return this.worldPaused;
    }

    protected configureLayers(): void {}

    protected spawnMapObjects(_tilemapData: TiledTilemapData): void {}

    protected handleInteraction(_obj: TiledObject): void {}

    protected handleAutoTransition(_obj: TiledObject): void {}

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

    protected startDialogue(dialogue: DialogueInteraction, speakerName?: string, options?: DialogueStartOptions): void {
        if (this.interactIcon) {
            this.interactIcon.visible = false;
        }
        this.dialogueController.startDialogue(dialogue, speakerName, options);
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

    protected handleDialogueCompleteAction(option: DialogueInteraction): void {
        if (!option.completeAction) return;
        const handler = this.chapterDefinition.dialogueCompleteActionHandlers[option.completeAction];
        handler?.();
    }    

    protected handleDialogueChoiceAction(option: DialogueChoiceOption): void {
        if (!option.choiceAction) return;
        const handler = this.chapterDefinition.dialogueChoiceActionHandlers[option.choiceAction];
        handler?.();
    }

    protected consumeInventoryItem(item: InventoryItem): void {
        this.inventoryScreen.hide();

        item.consume({
            showDialogue: interaction => this.startDialogue(interaction),
            previewItemAction: action => this.previewItemAction(action),
            runItemAction: action => this.runItemAction(action)
        });
    }

    // use to determine the result before running actual action. So we can display different dialogues base on different world state 
    protected previewItemAction(_action: ItemUseAction): ItemUseResult {
        return {
            success: false,
            lines: ["Nothing happens."]
        };
    }
    
    protected runItemAction(action: ItemUseAction): ItemUseResult {
        return this.previewItemAction(action);
    }
    
    protected rejectAutoTransitionEntry(): void {
        this.transitioning = false;
    
        const ai = this.player.ai as PlayerAI;
    
        const safeTile = ai.currentTile.clone();
        const blockedDirection = ai.targetTile
            ? ai.targetTile.clone().sub(ai.currentTile)
            : ai.facing.clone();
    
        const bounceDirection = blockedDirection.scaled(-1);
        const bounceTile = safeTile.clone().add(bounceDirection);
    
        const safeTileCenter = this.ground.getTileCenter(safeTile.x, safeTile.y);
        const safePosition = this.player.getCenterForFeetPosition(
            safeTileCenter.x,
            safeTileCenter.y
        );
    
        this.player.position.copy(safePosition);
    
        ai.currentTile = safeTile;
        ai.targetTile = null;
        ai.moving = false;
        ai.moveProgress = 0;
        ai.moveStart = safePosition.clone();
        ai.moveEnd = safePosition.clone();
    
        if (!ai.canMoveToTile(safeTile, bounceDirection)) {
            ai.facing = bounceDirection;
            this.player.setSortTile(safeTile);
            ai.changeState(PlayerStateType.IDLE);
            return;
        }
    
        const bounceTileCenter = this.ground.getTileCenter(bounceTile.x, bounceTile.y);
        const bouncePosition = this.player.getCenterForFeetPosition(
            bounceTileCenter.x,
            bounceTileCenter.y
        );
    
        ai.facing = bounceDirection;
        ai.targetTile = bounceTile;
        ai.moveEnd = bouncePosition;
        ai.currentMoveDuration = ai.moveDuration;
        ai.moving = true;
    
        this.player.setSortTile(bounceTile);
        ai.changeState(PlayerStateType.MOVING);
    }

    protected movePlayerOneTileForward(options: ScriptedTileMoveOptions = {}): boolean {
        const ai = this.player.ai as PlayerAI;
        return this.movePlayerOneTileWithoutChangingFacing(ai.facing.clone(), options);
    }
    protected movePlayerOneTileForwardAsync(options: ScriptedTileMoveOptions = {}): Promise<boolean> {
        const ai = this.player.ai as PlayerAI;
    
        return new Promise(resolve => {
            const started = this.movePlayerOneTileForward(options);
    
            if (!started) {
                resolve(false);
                return;
            }
    
            ai.onMoveComplete = () => resolve(true);
        });
    }
    
    protected movePlayerOneTileBackward(options: ScriptedTileMoveOptions = {}): boolean {
        const ai = this.player.ai as PlayerAI;
        return this.movePlayerOneTileWithoutChangingFacing(ai.facing.scaled(-1), options);
    }
    protected movePlayerOneTileBackwardAsync(options: ScriptedTileMoveOptions = {}): Promise<boolean> {
        const ai = this.player.ai as PlayerAI;
    
        return new Promise(resolve => {
            const started = this.movePlayerOneTileBackward(options);
    
            if (!started) {
                resolve(false);
                return;
            }
    
            ai.onMoveComplete = () => resolve(true);
        });
    }
    
    
    private movePlayerOneTileWithoutChangingFacing(direction: Vec2, options: ScriptedTileMoveOptions = {}): boolean {
        const ai = this.player.ai as PlayerAI;
    
        if (ai.moving) {
            return false;
        }
    
        const originalFacing = ai.facing.clone();
        const startTile = ai.currentTile.clone();
    
        if (!options.ignoreCollision && !ai.canMoveToTile(startTile, direction)) {
            return false;
        }
    
        const targetTile = startTile.clone().add(direction);
    
        const startTileCenter = this.ground.getTileCenter(startTile.x, startTile.y);
        const targetTileCenter = this.ground.getTileCenter(targetTile.x, targetTile.y);
    
        const startPosition = this.player.getCenterForFeetPosition(
            startTileCenter.x,
            startTileCenter.y
        );
    
        const targetPosition = this.player.getCenterForFeetPosition(
            targetTileCenter.x,
            targetTileCenter.y
        );
    
        this.player.position.copy(startPosition);
    
        ai.currentTile = startTile;
        ai.targetTile = targetTile;
        ai.moveProgress = 0;
        ai.moveStart = startPosition.clone();
        ai.moveEnd = targetPosition.clone();
        ai.currentMoveDuration = ai.moveDuration;
        ai.moving = true;
    
        ai.facing = originalFacing;
    
        this.player.setSortTile(targetTile);
        ai.changeState(PlayerStateType.MOVING);
    
        return true;
    }
    
    protected setPlayerFacing(direction: Vec2): void {
        const ai = this.player.ai as PlayerAI;
    
        ai.facing = direction.clone();
        this.playIdleForFacing(ai.facing);
    }
    
    
    protected playItemReceivedSFX(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SFX, {key: this.assets.sounds.itemReceivedSFX.key, loop: false, holdReference: false});
    }

    protected waitSeconds(seconds: number): Promise<void> {
        return new Promise(resolve => {
            window.setTimeout(resolve, seconds * 1000);
        });
    }
    
}
