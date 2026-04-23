import Updateable from "../../Wolfie2D/DataTypes/Interfaces/Updateable";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Scene from "../../Wolfie2D/Scene/Scene";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import PlayerActor from "../Actors/PlayerActor";

export default class CameraController implements Updateable {
    protected scene: Scene;
    protected viewport: Viewport;
    protected player: PlayerActor;
    protected ground: OrthogonalTilemap;

    protected readonly zoomLevel = 1;

    protected readonly mapBoundsLayerName = "MapBoundLayer";

    constructor(scene: Scene, viewport: Viewport, player: PlayerActor, ground: OrthogonalTilemap) {
        this.scene = scene;
        this.viewport = viewport;
        this.player = player;
        this.ground = ground;

        this.applyCameraBounds();
        this.viewport.follow(this.player);
        this.viewport.setZoomLevel(this.zoomLevel);
        this.viewport.snapToTarget();
    }

    update(deltaT: number): void {
        return;
    }
    
    /**
     * Sets the viewport bounds from the map's bounds layer so the camera stays inside the playable area.
     * Falls back to the full ground tilemap size if no bounds layer exists or if it has no painted tiles.
     */
    protected applyCameraBounds(): void {
        const mapBounds = this.scene.getTilemap(this.mapBoundsLayerName) as OrthogonalTilemap | null;

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
}