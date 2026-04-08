import Scene from "../../Wolfie2D/Scene/Scene";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import PlayerActor from "../Actors/PlayerActor";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import PlayerAI from "../AI/Player/PlayerAI";


export default class Chapter1Scene extends Scene {
    public loadScene(): void {
        this.load.tilemap("chapter1", "game_assets/tilemaps/Chapter1/Chapter1.json");
        this.load.spritesheet("fate", "game_assets/spritesheets/Fate.json");
        this.load.image("snowTree1", "game_assets/sprites/SnowTree1.png");

    }

    public startScene(): void {
        this.add.tilemap("chapter1");        
        this.addLayer("actors", 10);
        this.getLayer("Trees").setDepth(20);

        const ground = this.getTilemap("Ground") as OrthogonalTilemap;
        const collision = this.getTilemap("CollisionLayer") as OrthogonalTilemap;
        const mapBoundsLayer = this.getTilemap("MapBoundLayer") as OrthogonalTilemap;

        const mapSize = ground.size;

        // Read the raw Tiled data
        const tilemapData = this.resourceManager.getTilemap("chapter1");
        const spawnLayer = tilemapData.layers.find(layer => layer.name === "SpawnPoint");
        const spawn = spawnLayer?.objects?.[0];
       
        if (!spawn) {
            throw new Error("SpawnPoint layer is missing or empty");
        } 

        const treeLayer = tilemapData.layers.find(layer => layer.name === "Trees");
        const treePoints = treeLayer?.objects ?? [];
        for (const point of treePoints) {
            const tree = this.add.sprite("snowTree1", "Trees");
            tree.position.set(point.x, point.y - tree.size.y / 2);
        }


        //Create player sprite
        const player = this.add.animatedSprite(PlayerActor, "fate", "actors");

        const spawnTile = ground.getTilemapPosition(spawn.x, spawn.y);
        const tileTopLeft = ground.getWorldPosition(spawnTile.x, spawnTile.y);
        const tileSize = ground.getScaledTileSize();

        const feetX = tileTopLeft.x + tileSize.x / 2;
        const feetY = tileTopLeft.y + tileSize.y / 2;

        player.position.copy(player.getCenterForFeetPosition(feetX, feetY));
        player.addAI(PlayerAI, { startTile: spawnTile, tilemap: collision });

        // Start facing down
        player.animation.play("IDLE_DOWN", true);

        //===================== Camera setting ===========================

        const boundsSize = mapBoundsLayer.getDimensions();
        const boundTileSize = mapBoundsLayer.getScaledTileSize();

        let minCol = boundsSize.x;
        let minRow = boundsSize.y;
        let maxCol = -1;
        let maxRow = -1;

        for (let row = 0; row < boundsSize.y; row++) {
            for (let col = 0; col < boundsSize.x; col++) {
                if (mapBoundsLayer.getTile(col, row) !== 0) {
                    minCol = Math.min(minCol, col);
                    minRow = Math.min(minRow, row);
                    maxCol = Math.max(maxCol, col);
                    maxRow = Math.max(maxRow, row);
                }
            }
        }

        if (maxCol < 0 || maxRow < 0) {
            throw new Error("MapBoundLayer has no painted tiles");
        }

        const topLeft = mapBoundsLayer.getWorldPosition(minCol, minRow);
        const bottomRight = mapBoundsLayer.getWorldPosition(maxCol, maxRow);

        this.viewport.setBounds(
            topLeft.x,
            topLeft.y,
            bottomRight.x + boundTileSize.x,
            bottomRight.y + boundTileSize.y
        );

        this.viewport.follow(player);
        this.viewport.setZoomLevel(1);


    }

    public updateScene(): void {}
}
