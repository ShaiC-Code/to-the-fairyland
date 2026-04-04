import Scene from "../../Wolfie2D/Scene/Scene";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";

export default class Chapter1Scene extends Scene {
    public loadScene(): void {
        this.load.tilemap("chapter1", "game_assets/tilemaps/Chapter1/Chapter1.json");
    }

    public startScene(): void {
        const tilemapLayers = this.add.tilemap("chapter1");
        const firstLayer = tilemapLayers[0].getItems()[0] as OrthogonalTilemap;
        const mapSize = firstLayer.size;
        const center = new Vec2(mapSize.x / 2, mapSize.y / 2);

        this.viewport.setBounds(0, 0, mapSize.x, mapSize.y);
        this.viewport.setZoomLevel(1);
        this.viewport.setCenter(center);
        this.viewport.setFocus(center);
    }

    public updateScene(): void {}
}
