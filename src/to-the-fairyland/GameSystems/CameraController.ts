import Updateable from "../../Wolfie2D/DataTypes/Interfaces/Updateable";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Scene from "../../Wolfie2D/Scene/Scene";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import EaseFunctions from "../../Wolfie2D/Utils/EaseFunctions";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import PlayerActor from "../Actors/PlayerActor";

export default class CameraController implements Updateable {
    protected scene: Scene;
    protected viewport: Viewport;
    protected player: PlayerActor;
    protected ground: OrthogonalTilemap;
    protected actorLayerName: string;

    private cameraTarget: AnimatedSprite;
    private followPlayer = true;
    private heldCameraCenter = Vec2.ZERO;
    private seedX: number = 0;
    private seedY: number = 0;
    private shakeTime: number = 0;
    private shakeDuration: number = 0;
    private shakeStrength: number = 0;
    private zoomStartLevel = 1;
    private zoomTargetLevel = 1;
    private zoomDurationSeconds = 0;
    private zoomElapsedSeconds = 0;

    protected readonly zoomLevel = 1;
    protected readonly minZoomLevel = 0.1;
    protected readonly mapBoundsLayerName = "MapBoundLayer";

    constructor(scene: Scene, viewport: Viewport, player: PlayerActor, ground: OrthogonalTilemap, actorLayerName: string) {
        this.scene = scene;
        this.viewport = viewport;
        this.player = player;
        this.ground = ground;
        this.actorLayerName = actorLayerName;

        this.cameraTarget = this.scene.add.animatedSprite(
            AnimatedSprite,
            this.player.sceneAssets.spritesheets.playerSheet.key,
            this.actorLayerName
        );
        this.cameraTarget.visible = false;
        this.cameraTarget.alpha = 0;
        this.cameraTarget.scale.set(0, 0);
        this.cameraTarget.position.copy(this.player.position);
        this.cameraTarget.freeze();
        this.cameraTarget.disablePhysics();

        this.applyCameraBounds();
        this.viewport.follow(this.cameraTarget);
        this.viewport.setZoomLevel(this.zoomLevel);
        this.viewport.snapToTarget();
    }

    update(deltaT: number): void {
        if (this.followPlayer) {
            this.cameraTarget.position.copy(this.player.position);
        } else {
            this.cameraTarget.position.copy(this.heldCameraCenter);
        }

        if (this.shakeTime > 0) {
            this.shakeTime = Math.max(0, this.shakeTime - deltaT*1000);

            const t = (this.shakeDuration - this.shakeTime) / 1000;

            const decay = Math.exp(-t * 3);
            const frequency = 20;

            this.seedX = Math.random() * 1000;
            this.seedY = Math.random() * 1000;
            
            const jitterX = Math.sin(t * 13.7 + this.seedX) * 0.5;
            const jitterY = Math.sin(t * 17.3 + this.seedY) * 0.5;

            const offsetX = Math.sin(t * frequency + jitterX);
            const offsetY = Math.sin(t * frequency * 1.3 + jitterY);

            this.cameraTarget.position.x += offsetX * this.shakeStrength * decay * 0.75;
            this.cameraTarget.position.y += offsetY * this.shakeStrength * decay * 1.5;
        }

        this.updateZoom(deltaT);
    }

    public shake(duration: number, strength: number): void {
        this.shakeTime = duration;
        this.shakeDuration = duration;
        this.shakeStrength = strength;
    }

    public holdAtCurrentViewCenter(): void {
        this.followPlayer = false;
        this.heldCameraCenter = this.viewport.getCenter().clone();
        this.cameraTarget.position.copy(this.heldCameraCenter);
        this.viewport.snapToTarget(this.heldCameraCenter);
    }

    public followPlayerActor(): void {
        this.followPlayer = true;
        this.cameraTarget.position.copy(this.player.position);
        this.viewport.snapToTarget(this.cameraTarget.position);
    }

    public zoomTo(zoomLevel: number, durationSeconds: number): void {
        this.zoomTargetLevel = Math.max(this.minZoomLevel, zoomLevel);
        this.zoomStartLevel = this.viewport.getZoomLevel();
        this.zoomElapsedSeconds = 0;
        this.zoomDurationSeconds = Math.max(0, durationSeconds);

        if (this.zoomDurationSeconds === 0) {
            this.viewport.setZoomLevel(this.zoomTargetLevel);
        }
    }

    public expandBoundsToFullMap(): void {
        this.viewport.setBounds(0, 0, this.ground.size.x, this.ground.size.y);
        this.viewport.snapToTarget(this.followPlayer ? this.player.position : this.heldCameraCenter);
    }

    private updateZoom(deltaT: number): void {
        if (this.zoomDurationSeconds <= 0) {
            return;
        }

        this.zoomElapsedSeconds = Math.min(this.zoomDurationSeconds, this.zoomElapsedSeconds + deltaT);

        const progress = MathUtils.clamp01(this.zoomElapsedSeconds / this.zoomDurationSeconds);
        const easedProgress = EaseFunctions.easeInOutSine(progress);
        this.viewport.setZoomLevel(MathUtils.lerp(this.zoomStartLevel, this.zoomTargetLevel, easedProgress));

        if (progress >= 1) {
            this.zoomDurationSeconds = 0;
            this.viewport.setZoomLevel(this.zoomTargetLevel);
        }
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
