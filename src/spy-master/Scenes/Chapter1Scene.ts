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
    }

    public startScene(): void {
        this.add.tilemap("chapter1");

        const ground = this.getTilemap("Ground") as OrthogonalTilemap;
        const collision = this.getTilemap("CollisionLayer") as OrthogonalTilemap;
        const mapSize = ground.size;

        //Layer to place any actors
        this.addLayer("actors", 10);

        // Read the raw Tiled data
        const tilemapData = this.resourceManager.getTilemap("chapter1");
        const spawnLayer = tilemapData.layers.find(layer => layer.name === "SpawnPoint");
        const spawn = spawnLayer?.objects?.[0];

        if (!spawn) {
            throw new Error("SpawnPoint layer is missing or empty");
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

        //Camera setting
        this.viewport.setBounds(0, 0, mapSize.x, mapSize.y);
        this.viewport.follow(player);
        this.viewport.setZoomLevel(1);


    }

    public updateScene(): void {}
}
