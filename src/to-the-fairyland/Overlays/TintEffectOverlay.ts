import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import OverlayLayer, { OverlayLayerOptions } from "./OverlayLayer";

export default class TintEffectOverlay extends OverlayLayer {
    private readonly tintOverlayKey = "tintOverlay";
    private overlayColor: Color;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, overlayColor: Color, options?: OverlayLayerOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);

        this.overlayColor = overlayColor;
        this.initializeOverlay();
    }

    protected override initializeOverlay(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.addRect(this.tintOverlayKey, new Vec2(screenCenter.x, screenCenter.y), new Vec2(viewportSize.x, viewportSize.y), this.overlayColor);

        // Hide by default
        this.layer.setHidden(true);
    }

    public override update(deltaT: number): void {
        super.update(deltaT);
    }

    public setOverlayColor(overlayColor: Color) {
        this.overlayColor = overlayColor;
        const tintOverlay = this.getOverlayElement(this.tintOverlayKey) as Rect | undefined;
        if (tintOverlay) {
            tintOverlay.setColor(overlayColor);
        }
    }
}