import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { TiledObject, TiledTilemapData, TiledLayerData} from "../../Wolfie2D/DataTypes/Tilesets/TiledData";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Scene from "../../Wolfie2D/Scene/Scene";
import PlayerActor from "../Actors/PlayerActor";
import PlayerAI from "../AI/Player/PlayerAI";

type AssetRef = Readonly<{
    key: string;
    path: string;
}>;

type SceneEntranceData = {
    spawnName?: string;
};

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
    protected readonly entranceLayerName = "Entrances";

    protected player!: PlayerActor;
    protected ground!: OrthogonalTilemap;
    protected collision!: OrthogonalTilemap;
    protected interactables: TiledObject[] = [];
    protected spawnName?: string;
    protected entrances: TiledObject[] = [];

    // lets the scene receive data, ex: {spawnName: "Door1"}
    public override initScene(init: SceneEntranceData = {}): void {
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
        
    }

    public override updateScene(_deltaT: number): void {
        const ai = this.player.ai as PlayerAI;
        const controller = ai.controller;

        if (ai.targetTile) {
            const entrance = this.entrances.find(obj => {
                const tile = this.getObjectTile(obj);
                return tile.x === ai.targetTile!.x && tile.y === ai.targetTile!.y;
            });
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
    
    protected loadExtraAssets(): void {}

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
