import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import UIScreen, { UIScreenOptions } from "../UIScreen";
import AudioController from "../../GameSystems/AudioController";

export default class SplashScreen extends UIScreen {
    private splashImageKey: string;
    private onProceed: () => void;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, audioController: AudioController, splashImageKey: string, onProceed: () => void, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, audioController, options);
        this.splashImageKey = splashImageKey;
        this.onProceed = onProceed;
        this.initializeUI();
    }

    protected override initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.addUIImage("splashImage", new Vec2(screenCenter.x, screenCenter.y), new Vec2(viewportSize.x, viewportSize.y), this.splashImageKey);
        this.addClickableOverlay("clickOverlay", new Vec2(screenCenter.x, screenCenter.y), new Vec2(viewportSize.x, viewportSize.y), {onClick: () => this.onProceed()});
        this.setNavigationButtons(["clickOverlay"]);

        // Hide by default
        this.layer.setHidden(true);
    }
}
