import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { TiledObject, TiledTilemapData } from "../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Input from "../../Wolfie2D/Input/Input";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Scene from "../../Wolfie2D/Scene/Scene";
import PlayerActor from "../Actors/PlayerActor";
import PlayerAI from "../AI/Player/PlayerAI";

type AssetRef = Readonly<{
    key: string;
    path: string;
}>;

export default abstract class MappedAdventureScene extends Scene {
    // The tilemap to load for the scene, pass from sub scenes
    protected abstract readonly tilemap: AssetRef;

    // The player to load for the scenes
    protected readonly playerSheet: AssetRef = {
        key: "fate",
        path: "game_assets/spritesheets/Fate.json"
    };

    protected readonly groundLayerName = "Ground";
    protected readonly collisionLayerName = "CollisionLayer";
    protected readonly mapBoundsLayerName = "MapBoundLayer";
    protected readonly spawnLayerName = "SpawnPoint";
    protected readonly interactablesLayerName = "Interactables";
    protected readonly actorLayerName = "actors";
    protected readonly actorLayerDepth = 10;
    protected readonly zoomLevel = 1;

    protected player!: PlayerActor;
    protected ground!: OrthogonalTilemap;
    protected collision!: OrthogonalTilemap;
    protected interactables: TiledObject[] = [];
    protected spawnName?: string;

    // lets the scene receive data, ex: {spawnName: "Door1"}
    public override initScene(init: Record<string, any>): void {
        this.spawnName = init?.spawnName;
    }

    public override loadScene(): void {
        this.load.tilemap(this.tilemap.key, this.tilemap.path);
        this.load.spritesheet(this.playerSheet.key, this.playerSheet.path);
        this.loadExtraAssets();
    }

    public override startScene(): void {
        this.add.tilemap(this.tilemap.key);
        this.addLayer(this.actorLayerName, this.actorLayerDepth);

        this.configureLayers();

        this.ground = this.getRequiredTilemap(this.groundLayerName);
        this.collision = this.getRequiredTilemap(this.collisionLayerName);

        const tilemapData = this.resourceManager.getTilemap(this.tilemap.key) as TiledTilemapData;
        const spawn = this.getSpawnObject(tilemapData);
        if (!spawn) {
            throw new Error(`SpawnPoint layer is missing or empty in map "${this.tilemap.key}"`);
        }

        const interactLayer = tilemapData.layers.find(layer => layer.name === this.interactablesLayerName);
        this.interactables = interactLayer?.objects ?? [];

        this.spawnMapObjects(tilemapData);

        this.player = this.add.animatedSprite(PlayerActor, this.playerSheet.key, this.actorLayerName);
        this.spawnPlayerAt(spawn);
        this.player.animation.play("IDLE_DOWN", true);

        this.applyCameraBounds();
        this.viewport.follow(this.player);
        this.viewport.setZoomLevel(this.zoomLevel);
    }

    public override updateScene(_deltaT: number): void {
        const ai = this.player.ai as PlayerAI;
        if (ai.moving || !this.isInteractPressed()) {
            return;
        }

        const nextTile = ai.currentTile.clone().add(ai.facing);
        const hit = this.findInteractableAtTile(nextTile);
        if (hit) {
            this.handleInteraction(hit);
        }
    }
    
    protected loadExtraAssets(): void {}

    protected configureLayers(): void {}

    protected spawnMapObjects(_tilemapData: TiledTilemapData): void {}

    protected handleInteraction(_obj: TiledObject): void {}

    /**
     * Returns true if the player pressed any interact key this frame.
     * Current interact keys are J, E, and Z.
     * @returns True if an interact key was just pressed, false otherwise.
     */
    protected isInteractPressed(): boolean {
        return Input.isKeyJustPressed("j")
            || Input.isKeyJustPressed("e")
            || Input.isKeyJustPressed("z");
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
     * Finds the spawn object to use for this scene.
     * If a spawn name was provided through init data, it tries to find a matching named spawn first.
     * Otherwise, it falls back to the first object in the SpawnPoint layer.
     * @param tilemapData The raw Tiled map data for the current scene.
     * @returns The selected spawn object, or undefined if the SpawnPoint layer has no objects.
     */
    protected getSpawnObject(tilemapData: TiledTilemapData): TiledObject | undefined {
        const spawnLayer = tilemapData.layers.find(layer => layer.name === this.spawnLayerName);
        if (!spawnLayer?.objects?.length) {
            return undefined;
        }

        if (this.spawnName) {
            const namedSpawn = spawnLayer.objects.find(obj => obj.name === this.spawnName);
            if (namedSpawn) {
                return namedSpawn;
            }
        }

        return spawnLayer.objects[0];
    }


    /**
     * Returns the tile (col, row) occupied by the given Tiled object.
     * The object's center point is used so rectangle objects map cleanly to a single tile.
     * @param obj The Tiled object to convert into tile coordinates.
     * @returns The tile (col, row) containing the object's center.
     */
    protected getObjectTile(obj: TiledObject): Vec2 {
        return this.ground.getTilemapPosition(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2
        );
    }

    /**
     * Places the player at the given spawn object and initializes PlayerAI with the correct start tile.
     * The player is positioned using feet alignment so the sprite stands correctly on the grid.
     * @param spawn The Tiled object that marks where the player should appear.
     */
    protected spawnPlayerAt(spawn: TiledObject): void {
        const spawnTile = this.getObjectTile(spawn);
        const tileTopLeft = this.ground.getWorldPosition(spawnTile.x, spawnTile.y);
        const tileSize = this.ground.getScaledTileSize();

        const feetX = tileTopLeft.x + tileSize.x / 2;
        const feetY = tileTopLeft.y + tileSize.y / 2;

        this.player.position.copy(this.player.getCenterForFeetPosition(feetX, feetY));
        this.player.addAI(PlayerAI, { startTile: spawnTile, tilemap: this.collision });
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
     * Finds the first interactable object whose tile position matches the given tile.
     * @param tile The tile coordinate to check for an interactable object.
     * @returns The matching interactable object, or undefined if no interactable is on that tile.
     */
    protected findInteractableAtTile(tile: Vec2): TiledObject | undefined {
        return this.interactables.find(obj => {
            const objTile = this.getObjectTile(obj);
            return objTile.x === tile.x && objTile.y === tile.y;
        });
    }
}
