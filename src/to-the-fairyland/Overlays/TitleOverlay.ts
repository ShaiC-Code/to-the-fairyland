import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import OverlayLayer, { OverlayLayerOptions } from "./OverlayLayer";

export type TitleOverlayOptions = OverlayLayerOptions & {
    backgroundColor?: Color;
    defaultTextColor?: TitleOverlayTextColor;
    fadeInSeconds?: number;
    fadeOutSeconds?: number;
    fontSize?: number;
    titleHeight?: number;
    horizontalPadding?: number;
    minTitleWidth?: number;
    pauseScene?: boolean;
    startDelaySeconds?: number;
};

export type TitleOverlayTextColor = "white" | "red" | "green";

export type TitleOverlayShowOptions = {
    fadeInSeconds?: number;
    fadeOutSeconds?: number;
    startDelaySeconds?: number;
};

type TitleOverlayPhase = "hidden" | "delay" | "fadeIn" | "hold" | "fadeOut";

type ScenePauseRegistrar = {
    registerScenePauseOverlay: (overlay: OverlayLayer) => void;
};

export default class TitleOverlay extends OverlayLayer {
    private readonly backgroundKey = "titleBackground";
    private readonly titleKey = "titleText";

    private readonly backgroundColor: Color;
    private readonly defaultTextColor: TitleOverlayTextColor;
    private readonly defaultFadeInSeconds: number;
    private readonly defaultFadeOutSeconds: number;
    private readonly fontSize: number;
    private readonly titleHeight: number;
    private readonly horizontalPadding: number;
    private readonly minTitleWidth: number;
    private readonly defaultStartDelaySeconds: number;

    private titleText = "";
    private phase: TitleOverlayPhase = "hidden";
    private phaseElapsedSeconds = 0;
    private holdDurationSeconds: number | undefined;
    private fadeInSeconds = 0;
    private fadeOutSeconds = 0;
    private fadeOutStartAlpha = 1;
    private overlayAlpha = 0;
    private startDelaySeconds = 0;
    private autoHideResolve: (() => void) | null = null;

    constructor(
        layerName: string,
        scene: Scene,
        getViewportCenter: () => Vec2,
        getViewportHalfSize: () => Vec2,
        options?: TitleOverlayOptions
    ) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, {
            ...options,
            useUILayer: options?.useUILayer ?? true
        });

        this.backgroundColor = options?.backgroundColor ?? new Color(0, 0, 0, 0.95);
        this.defaultTextColor = options?.defaultTextColor ?? "red";
        this.defaultFadeInSeconds = options?.fadeInSeconds ?? 0.35;
        this.defaultFadeOutSeconds = options?.fadeOutSeconds ?? 0.35;
        this.fontSize = options?.fontSize ?? 64;
        this.titleHeight = options?.titleHeight ?? 160;
        this.horizontalPadding = options?.horizontalPadding ?? 80;
        this.minTitleWidth = options?.minTitleWidth ?? 400;
        this.defaultStartDelaySeconds = options?.startDelaySeconds ?? 0;

        if (options?.pauseScene) {
            this.registerScenePauseOverlay();
        }

        this.initializeOverlay();
    }

    protected override initializeOverlay(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.addRect(this.backgroundKey, screenCenter, viewportSize, this.backgroundColor);
        this.addLabel(
            this.titleKey,
            screenCenter.clone(),
            this.getTitleSize(viewportSize),
            this.titleText,
            this.fontSize,
            { halign: "center", valign: "center" }
        );

        const title = this.getTitleLabel();
        if (title) {
            title.textColor = this.getTextColor(this.defaultTextColor);
            title.borderWidth = 0;
        }

        this.layer.setHidden(true);
        this.setOverlayAlpha(0);
    }

    public override update(deltaT: number): void {
        super.update(deltaT);

        if (!this.getIsVisible()) {
            return;
        }

        this.updateBounds();
        this.updatePhase(deltaT);
    }

    public setText(text: string): void {
        this.titleText = text;

        const title = this.getTitleLabel();
        if (title) {
            title.text = text;
        }
    }

    public showTitle(
        text: string,
        durationSeconds?: number,
        textColor: TitleOverlayTextColor = this.defaultTextColor,
        options?: TitleOverlayShowOptions
    ): Promise<void> {
        this.resolveAutoHide();
        const completionPromise = new Promise<void>(resolve => {
            this.autoHideResolve = resolve;
        });

        this.setText(text);
        this.setTextColor(textColor);
        this.updateBounds();
        this.show();

        this.holdDurationSeconds = durationSeconds === undefined
            ? undefined
            : Math.max(0, durationSeconds);
        this.fadeInSeconds = Math.max(0, options?.fadeInSeconds ?? this.defaultFadeInSeconds);
        this.fadeOutSeconds = Math.max(0, options?.fadeOutSeconds ?? this.defaultFadeOutSeconds);
        this.startDelaySeconds = Math.max(0, options?.startDelaySeconds ?? this.defaultStartDelaySeconds);
        this.phaseElapsedSeconds = 0;
        this.phase = this.startDelaySeconds > 0 ? "delay" : "fadeIn";
        this.setOverlayAlpha(0);

        if (this.phase === "fadeIn" && this.fadeInSeconds === 0) {
            this.enterHoldPhase();
        }

        return completionPromise;
    }

    public override hide(): void {
        if (this.phase === "hidden") {
            this.resolveAutoHide();
            return;
        }

        this.beginFadeOut();
    }

    private resolveAutoHide(): void {
        if (!this.autoHideResolve) {
            return;
        }

        const resolve = this.autoHideResolve;
        this.autoHideResolve = null;
        resolve();
    }

    public override shouldPauseWorld(): boolean {
        return this.phase === "hold";
    }

    private registerScenePauseOverlay(): void {
        const scene = this.scene as Scene & Partial<ScenePauseRegistrar>;

        if (typeof scene.registerScenePauseOverlay === "function") {
            scene.registerScenePauseOverlay(this);
        }
    }

    public setTextColor(textColor: TitleOverlayTextColor): void {
        const title = this.getTitleLabel();
        if (title) {
            title.textColor = this.getTextColor(textColor);
        }
    }

    private updateBounds(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.updateOverlayElement(
            this.getOverlayElement(this.backgroundKey),
            screenCenter,
            viewportSize
        );
        this.updateOverlayElement(
            this.getOverlayElement(this.titleKey),
            screenCenter.clone(),
            this.getTitleSize(viewportSize)
        );
    }

    private updatePhase(deltaT: number): void {
        this.phaseElapsedSeconds += deltaT;

        switch (this.phase) {
            case "delay":
                this.setOverlayAlpha(0);

                if (this.phaseElapsedSeconds >= this.startDelaySeconds) {
                    this.phase = "fadeIn";
                    this.phaseElapsedSeconds = 0;

                    if (this.fadeInSeconds === 0) {
                        this.enterHoldPhase();
                    }
                }
                break;
            case "fadeIn":
                this.setOverlayAlpha(this.getPhaseProgress(this.fadeInSeconds));

                if (this.phaseElapsedSeconds >= this.fadeInSeconds) {
                    this.enterHoldPhase();
                }
                break;
            case "hold":
                this.setOverlayAlpha(1);

                if (this.holdDurationSeconds !== undefined
                    && this.phaseElapsedSeconds >= this.holdDurationSeconds
                ) {
                    this.beginFadeOut();
                }
                break;
            case "fadeOut":
                this.setOverlayAlpha(this.fadeOutStartAlpha * (1 - this.getPhaseProgress(this.fadeOutSeconds)));

                if (this.phaseElapsedSeconds >= this.fadeOutSeconds) {
                    this.finishHide();
                }
                break;
            case "hidden":
                break;
        }
    }

    private enterHoldPhase(): void {
        this.phase = "hold";
        this.phaseElapsedSeconds = 0;
        this.setOverlayAlpha(1);

        if (this.holdDurationSeconds === 0) {
            this.beginFadeOut();
        }
    }

    private beginFadeOut(): void {
        if (this.phase === "fadeOut") {
            return;
        }

        this.fadeOutStartAlpha = this.overlayAlpha;

        if (this.fadeOutSeconds === 0 || this.fadeOutStartAlpha <= 0) {
            this.finishHide();
            return;
        }

        this.phase = "fadeOut";
        this.phaseElapsedSeconds = 0;
    }

    private finishHide(): void {
        this.phase = "hidden";
        this.phaseElapsedSeconds = 0;
        this.setOverlayAlpha(0);
        super.hide();
        this.resolveAutoHide();
    }

    private getPhaseProgress(durationSeconds: number): number {
        if (durationSeconds <= 0) {
            return 1;
        }

        return Math.max(0, Math.min(this.phaseElapsedSeconds / durationSeconds, 1));
    }

    private setOverlayAlpha(alpha: number): void {
        const clampedAlpha = Math.max(0, Math.min(alpha, 1));
        this.overlayAlpha = clampedAlpha;

        this.getOverlayElement(this.backgroundKey)!.alpha = clampedAlpha;
        this.getOverlayElement(this.titleKey)!.alpha = clampedAlpha;
    }

    private getTitleSize(viewportSize: Vec2): Vec2 {
        return new Vec2(
            Math.max(this.minTitleWidth, viewportSize.x - this.horizontalPadding * 2),
            this.titleHeight
        );
    }

    private getTitleLabel(): Label | undefined {
        return this.getOverlayElement(this.titleKey) as Label | undefined;
    }

    private getTextColor(textColor: TitleOverlayTextColor): Color {
        switch (textColor) {
            case "white":
                return Color.WHITE;
            case "green":
                return Color.GREEN;
            case "red":
            default:
                return new Color(170, 0, 0, 1);
        }
    }
}
