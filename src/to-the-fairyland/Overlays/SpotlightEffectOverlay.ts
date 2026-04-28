import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import PlayerActor from "../Actors/PlayerActor";
import SpotlightOverlay from "../UI/CustomUIElements/SpotlightOverlay";
import OverlayLayer, { OverlayLayerOptions } from "./OverlayLayer";

export default class SpotlightEffectOverlay extends OverlayLayer {
    private readonly spolightOverlayKey = "spotlightOverlay";
    private player: PlayerActor | null = null;
    private radius: number = 0;
    private innerRadiusRatio: number = 0;
    private overlayColor: Color;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, overlayColor: Color, player?: PlayerActor, radius?: number, innerRadiusRatio?: number, options?: OverlayLayerOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);

        this.overlayColor = overlayColor;
        this.player = player ?? null;
        this.radius = radius ?? 0;
        this.innerRadiusRatio = innerRadiusRatio ?? 0;
        this.initializeOverlay();
    }

    protected override initializeOverlay(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();
        const paddingX = viewportSize.x;
        const paddingY = viewportSize.y;


        if (this.player) {
            const playerCenter = this.player.relativePosition.clone();
            this.addSpotlightOverlay(this.spolightOverlayKey, new Vec2(playerCenter.x, playerCenter.y), new Vec2(viewportSize.x + paddingX, viewportSize.y + paddingY), this.radius, this.innerRadiusRatio, this.overlayColor);
        } else {
            this.addSpotlightOverlay(this.spolightOverlayKey, new Vec2(screenCenter.x, screenCenter.y), new Vec2(viewportSize.x + paddingX, viewportSize.y + paddingY), this.radius, this.innerRadiusRatio, this.overlayColor);
        }

        // Hide by default
        this.layer.setHidden(true);
    }

    public override update(deltaT: number): void {
        super.update(deltaT);
        if (this.player) {
            const playerCenter = this.player.relativePosition.clone();
            const spotlightOverlay = this.getOverlayElement(this.spolightOverlayKey) as SpotlightOverlay | undefined;
            spotlightOverlay?.position.copy(new Vec2(playerCenter.x, playerCenter.y));
        }
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