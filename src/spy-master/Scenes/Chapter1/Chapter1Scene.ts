import Scene from "../../../Wolfie2D/Scene/Scene";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import PlayerActor from "../../Actors/PlayerActor";
import AABB from "../../../Wolfie2D/DataTypes/Shapes/AABB";
import PlayerAI from "../../AI/Player/PlayerAI";
import Input from "../../../Wolfie2D/Input/Input";
import { TiledObject } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import ShelterScene from "./ShelterScene";



export default class Chapter1Scene extends Scene {

    private player!: PlayerActor;
    private ground!: OrthogonalTilemap;
    private interactables: TiledObject[] = [];

    public loadScene(): void {
        this.load.tilemap("chapter1", "game_assets/tilemaps/Chapter1/Chapter1.json");
        this.load.spritesheet("fate", "game_assets/spritesheets/Fate.json");
        this.load.image("snowTree1", "game_assets/sprites/SnowTree1.png");

    }

    public startScene(): void {
        this.add.tilemap("chapter1");        
        this.addLayer("actors", 10);
        this.getLayer("Trees").setDepth(20);

        const collision = this.getTilemap("CollisionLayer") as OrthogonalTilemap;        
        const mapBoundsLayer = this.getTilemap("MapBoundLayer") as OrthogonalTilemap;
        this.ground = this.getTilemap("Ground") as OrthogonalTilemap;

        // Read the raw Tiled data
        const tilemapData = this.resourceManager.getTilemap("chapter1");

        const treeLayer = tilemapData.layers.find(layer => layer.name === "Trees");
        const spawnLayer = tilemapData.layers.find(layer => layer.name === "SpawnPoint");
        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables");

        const spawn = spawnLayer?.objects?.[0];
        if (!spawn) {
            throw new Error("SpawnPoint layer is missing or empty");
        } 

        
        const treePoints = treeLayer?.objects ?? [];
        for (const point of treePoints) {
            const tree = this.add.sprite("snowTree1", "Trees");
            tree.position.set(point.x, point.y - tree.size.y / 2);
        }

        this.interactables = interactLayer?.objects ?? [];

        //Create player sprite
        this.player = this.add.animatedSprite(PlayerActor, "fate", "actors");

        const spawnTile = this.ground.getTilemapPosition(spawn.x, spawn.y);
        const tileTopLeft = this.ground.getWorldPosition(spawnTile.x, spawnTile.y);
        const tileSize = this.ground.getScaledTileSize();

        const feetX = tileTopLeft.x + tileSize.x / 2;
        const feetY = tileTopLeft.y + tileSize.y / 2;

        this.player.position.copy(this.player.getCenterForFeetPosition(feetX, feetY));
        this.player.addAI(PlayerAI, { startTile: spawnTile, tilemap: collision });

        // Start facing down
        this.player.animation.play("IDLE_DOWN", true);

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

        this.viewport.follow(this.player);
        this.viewport.setZoomLevel(1);
    }

    public updateScene(): void {
        const ai = this.player.ai as PlayerAI;
        if (ai.moving) {
            return;
        }
        
        if (Input.isKeyJustPressed("j") || Input.isKeyJustPressed("e") || Input.isKeyJustPressed("z")) {
            const nextTile = ai.currentTile.clone().add(ai.facing);

            const hit = this.interactables.find(obj => {
                const objTile = this.ground.getTilemapPosition(
                    obj.x + obj.width / 2,
                    obj.y + obj.height / 2
                );
        
                return objTile.x === nextTile.x && objTile.y === nextTile.y;
            });
        
            if (hit?.name === "Door") {
                this.sceneManager.changeToScene(ShelterScene);
            }
        }

        return;

    }
}
