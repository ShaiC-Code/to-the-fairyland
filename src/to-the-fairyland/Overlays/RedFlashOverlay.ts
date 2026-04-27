import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import OverlayLayer, { OverlayLayerOptions } from "./OverlayLayer";

export type RedFlashOverlayOptions = OverlayLayerOptions & {
    duration?: number;
    maxAlpha?: number;
    pulseCount?: number;
};

export default class RedFlashOverlay extends OverlayLayer {
    private readonly redFlashOverlayKey = "redFlashOverlay";
    private readonly overlayColor = new Color(255, 0, 0, 0);

    private duration: number;
    private maxAlpha: number;
    private pulseCount: number;
    private elapsed = 0;
    private playing = false;

    constructor(
        layerName: string,
        scene: Scene,
        getViewportCenter: () => Vec2,
        getViewportHalfSize: () => Vec2,
        options?: RedFlashOverlayOptions
    ) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);

        this.duration = options?.duration ?? 0.35;
        this.maxAlpha = options?.maxAlpha ?? 0.55;
        this.pulseCount = options?.pulseCount ?? 1;

        this.initializeOverlay();
    }

    protected override initializeOverlay(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.addRect(
            this.redFlashOverlayKey,
            new Vec2(screenCenter.x, screenCenter.y),
            new Vec2(viewportSize.x, viewportSize.y),
            this.overlayColor
        );

        this.layer.setHidden(true);
    }

    public override update(deltaT: number): void {
        this.updateBounds();

        if (!this.playing) {
            return;
        }

        this.elapsed += deltaT;

        if (this.elapsed >= this.duration) {
            this.stop();
            return;
        }

        this.setFlashAlpha(this.getAlphaAtProgress(this.elapsed / this.duration));
    }

    public play(): void {
        this.elapsed = 0;
        this.playing = true;
        this.show();
        this.updateBounds();
        this.setFlashAlpha(this.maxAlpha);
    }

    public stop(): void {
        this.elapsed = 0;
        this.playing = false;
        this.setFlashAlpha(0);
        this.hide();
    }

    private updateBounds(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.updateOverlayElement(
            this.getOverlayElement(this.redFlashOverlayKey),
            screenCenter,
            viewportSize
        );
    }

    private setFlashAlpha(alpha: number): void {
        const overlay = this.getOverlayElement(this.redFlashOverlayKey) as Rect | undefined;
        if (overlay) {
            overlay.alpha = Math.max(0, Math.min(alpha, this.maxAlpha));
        }
    }

    private getAlphaAtProgress(progress: number): number {
        const cycleCount = Math.max(1, this.pulseCount);
        const cycleProgress = (progress * cycleCount) % 1;
        const flashShape = cycleProgress < 0.2
            ? cycleProgress / 0.2
            : 1 - ((cycleProgress - 0.2) / 0.8);

        return this.maxAlpha * Math.max(0, flashShape) * (1 - progress);
    }
}
