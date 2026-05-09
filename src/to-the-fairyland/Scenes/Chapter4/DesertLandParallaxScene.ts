import DesertSceneBase from "./DesertSceneBase";

export default class DesertLandParallaxScene extends DesertSceneBase {
    protected readonly tilemap = {
        key: "desertLandParallax",
        path: "/assets/tilemaps/Chapter4/DesertLandParallax.json"
    };

    protected override configureLayers(): void {
        super.configureLayers();
        this.getLayer(this.groundLayerName).setDepth(2);
        this.getLayer("FireRock").setDepth(3);
    }
}
