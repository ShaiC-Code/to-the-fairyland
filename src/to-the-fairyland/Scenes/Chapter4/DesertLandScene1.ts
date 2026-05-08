import TitleOverlay from "../../Overlays/TitleOverlay";
import DesertSceneBase from "./DesertSceneBase";

export default class DesertLandScene1 extends DesertSceneBase {
    protected readonly tilemap = {
        key: "desertLand1",
        path: "/assets/tilemaps/Chapter4/DesertLand1.json"
    };

    private introTitleOverlay!: TitleOverlay;
    private readonly introTitleLayerName = "DesertIntroTitleOverlay";
    private readonly introTitleText = "Fairyland is right ahead.";
    private readonly introTitleDurationSeconds = 3;
    
    public override startScene(): void {
        super.startScene();
        this.showIntroTitle();
    }

    protected override configureLayers(): void {
        super.configureLayers();
        this.introTitleOverlay = new TitleOverlay(
            this.introTitleLayerName,
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            {
                fontSize: 52,
                pauseScene: true
            }
        );
    }

    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.introTitleOverlay.update(deltaT);
    }

    private showIntroTitle(): void {
        this.introTitleOverlay.showTitle(
            this.introTitleText,
            this.introTitleDurationSeconds,
            "white"
        );
    }
}
