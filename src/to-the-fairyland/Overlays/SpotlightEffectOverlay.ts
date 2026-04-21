import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import SpotlightOverlay from "../UI/CustomUIElements/SpotlightOverlay";
import OverlayLayer from "./OverlayLayer";

type SpotlightOverlayOptions = {
    radius?: number;
    innerRadiusRatio?: number;
};

export default class SpotlightEffectOverlay extends OverlayLayer {
    private readonly spolightOverlayKey = "spotlightOverlay";
    private static depth: number = 9999;
    private radius: number = 0;
    private innerRadiusRatio: number = 0;
    private overlayColor: Color;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, overlayColor: Color, depth: number = SpotlightEffectOverlay.depth, options?: SpotlightOverlayOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, depth);

        options = options ?? {};
        this.radius = options.radius ?? 0;
        this.innerRadiusRatio = options.innerRadiusRatio ?? 0;
        this.overlayColor = overlayColor;
        this.initializeOverlay();
    }

    protected override initializeOverlay(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.addSpotlightOverlay(this.spolightOverlayKey, new Vec2(screenCenter.x, screenCenter.y), new Vec2(viewportSize.x, viewportSize.y), this.radius, this.innerRadiusRatio, this.overlayColor);

        // Hide by default
        this.layer.setHidden(true);
    }

    public setRadius(radius: number) {
        this.radius = radius;
        const spotlightOverlay = this.getOverlayElement(this.spolightOverlayKey) as SpotlightOverlay | undefined;
        if (spotlightOverlay) {
            spotlightOverlay.radius = radius;
        }
    }

    public setInnerRadiusRatio(innerRadiusRatio: number) {
        this.innerRadiusRatio = innerRadiusRatio;
        const spotlightOverlay = this.getOverlayElement(this.spolightOverlayKey) as SpotlightOverlay | undefined;
        if (spotlightOverlay) {
            spotlightOverlay.setInnerRadiusRatio(innerRadiusRatio);
        }
    }

    public setOverlayColor(overlayColor: Color) {
        this.overlayColor = overlayColor;
        const spotlightOverlay = this.getOverlayElement(this.spolightOverlayKey) as SpotlightOverlay | undefined;
        if (spotlightOverlay) {
            spotlightOverlay.setOverlayColor(overlayColor);
        }
    }
}