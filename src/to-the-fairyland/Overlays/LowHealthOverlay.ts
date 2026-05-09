import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../Wolfie2D/Scene/Scene";
import OverlayLayer, { OverlayLayerOptions } from "./OverlayLayer";

export type LowHealthOverlayOptions = OverlayLayerOptions & {
    thresholdRatio?: number;
    maxAlpha?: number;
    pulseAmount?: number;
    pulseFrequencySeconds?: number;
    getHealthRatio: () => number;
};

export default class LowHealthOverlay extends OverlayLayer {
    private readonly overlayKey = "lowHealthOverlay";
    private readonly imageKey: string;
    private readonly thresholdRatio: number;
    private readonly maxAlpha: number;
    private readonly pulseAmount: number;
    private readonly pulseFrequencySeconds: number;
    private readonly getHealthRatio: () => number;
    private pulseElapsedSeconds = 0;
    private currentAlpha = 0;

    constructor(
        layerName: string,
        scene: Scene,
        getViewportCenter: () => Vec2,
        getViewportHalfSize: () => Vec2,
        imageKey: string,
        options: LowHealthOverlayOptions
    ) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, {
            ...options,
            useUILayer: options.useUILayer ?? true
        });

        this.imageKey = imageKey;
        this.thresholdRatio = Math.max(0.01, Math.min(options.thresholdRatio ?? 0.4, 1));
        this.maxAlpha = Math.max(0, Math.min(options.maxAlpha ?? 0.65, 1));
        this.pulseAmount = Math.max(0, Math.min(options.pulseAmount ?? 0.22, 1));
        this.pulseFrequencySeconds = Math.max(0.01, options.pulseFrequencySeconds ?? 1.15);
        this.getHealthRatio = options.getHealthRatio;

        this.initializeOverlay();
    }

    protected override initializeOverlay(): void {
        const viewportSize = this.getViewportHalfSize().clone().scale(2);
        const screenCenter = this.getViewportHalfSize().clone();

        this.addUIImage(this.overlayKey, screenCenter, viewportSize, this.imageKey);
        this.setOverlayAlpha(0);
        this.layer.setHidden(true);
    }

    public override update(deltaT: number): void {
        this.pulseElapsedSeconds += deltaT;
        this.updateBounds();
        this.updateAlphaForHealth();
    }

    private updateBounds(): void {
        const viewportSize = this.getViewportHalfSize().clone().scale(2);
        const screenCenter = this.getViewportHalfSize().clone();
        const overlay = this.getOverlayElement(this.overlayKey) as Sprite | undefined;

        if (!overlay) {
            return;
        }

        overlay.position.copy(screenCenter);
        overlay.scale.set(
            overlay.size.x !== 0 ? viewportSize.x / overlay.size.x : 1,
            overlay.size.y !== 0 ? viewportSize.y / overlay.size.y : 1
        );
    }

    private updateAlphaForHealth(): void {
        const healthRatio = Math.max(0, Math.min(this.getHealthRatio(), 1));

        if (healthRatio >= this.thresholdRatio) {
            this.setOverlayAlpha(0);
            this.hide();
            return;
        }

        const dangerRatio = 1 - healthRatio / this.thresholdRatio;
        const baseAlpha = this.getBaseAlpha(dangerRatio);
        const pulseAlpha = Math.min(baseAlpha + this.pulseAmount, this.maxAlpha);

        this.setOverlayAlpha(this.lerp(baseAlpha, pulseAlpha, this.getPulseT()));
        this.show();
    }

    private getBaseAlpha(dangerRatio: number): number {
        return Math.max(
            0,
            Math.min(this.maxAlpha * dangerRatio, this.maxAlpha - this.pulseAmount)
        );
    }

    private getPulseT(): number {
        const phase = (this.pulseElapsedSeconds / this.pulseFrequencySeconds) % 2;
        const linearT = phase < 1
            ? phase
            : 2 - phase;

        return linearT * linearT * (3 - 2 * linearT);
    }

    private setOverlayAlpha(alpha: number): void {
        const overlay = this.getOverlayElement(this.overlayKey) as Sprite | undefined;
        this.currentAlpha = Math.max(0, Math.min(alpha, this.maxAlpha));

        if (overlay) {
            overlay.alpha = this.currentAlpha;
        }
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }
}
