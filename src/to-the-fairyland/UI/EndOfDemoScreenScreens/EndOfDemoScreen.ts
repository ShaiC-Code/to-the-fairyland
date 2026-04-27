import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Color from "../../../Wolfie2D/Utils/Color";
import UIScreen, { UIScreenOptions } from "../UIScreen";

export default class EndOfDemoScreen extends UIScreen {
    private readonly onProceed: () => void;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, onProceed: () => void, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);
        this.onProceed = onProceed;

        this.initializeUI();
    }

    protected override initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.addRect("background", new Vec2(screenCenter.x, screenCenter.y), new Vec2(viewportSize.x, viewportSize.y), Color.BLACK);
        this.addLabel(
            "title",
            new Vec2(screenCenter.x, screenCenter.y - 64),
            new Vec2(viewportSize.x - 100, 60),
            "To The Fairyland: Chapter 3",
            64,
            { halign: "center", valign: "middle" }
        );
        this.addLabel(
            "subtitle",
            new Vec2(screenCenter.x, screenCenter.y + 64),
            new Vec2(viewportSize.x - 100, 40),
            "Coming Soon",
            32,
            { halign: "center", valign: "middle" }
        );

        this.addClickableOverlay(
            "proceedOverlay",
            new Vec2(screenCenter.x, screenCenter.y),
            new Vec2(viewportSize.x, viewportSize.y),
            { onClick: () => this.onProceed() }
        );
        this.setNavigationButtons(["proceedOverlay"]);

        this.layer.setHidden(true);
    }
}
