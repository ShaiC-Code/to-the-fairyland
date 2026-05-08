import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import OverlayLayer, { OverlayLayerOptions } from "./OverlayLayer";

export type TitleOverlayOptions = OverlayLayerOptions & {
    backgroundColor?: Color;
    defaultTextColor?: TitleOverlayTextColor;
    fontSize?: number;
    titleHeight?: number;
    horizontalPadding?: number;
    minTitleWidth?: number;
    pauseScene?: boolean;
};

export type TitleOverlayTextColor = "white" | "red" | "green";

type ScenePauseRegistrar = {
    registerScenePauseOverlay: (overlay: OverlayLayer) => void;
};

export default class TitleOverlay extends OverlayLayer {
    private readonly backgroundKey = "titleBackground";
    private readonly titleKey = "titleText";

    private readonly backgroundColor: Color;
    private readonly defaultTextColor: TitleOverlayTextColor;
    private readonly fontSize: number;
    private readonly titleHeight: number;
    private readonly horizontalPadding: number;
    private readonly minTitleWidth: number;

    private titleText = "";
    private hideTimer: number | null = null;
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
        this.fontSize = options?.fontSize ?? 64;
        this.titleHeight = options?.titleHeight ?? 160;
        this.horizontalPadding = options?.horizontalPadding ?? 80;
        this.minTitleWidth = options?.minTitleWidth ?? 400;

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
    }

    public override update(deltaT: number): void {
        super.update(deltaT);

        if (!this.getIsVisible()) {
            return;
        }

        this.updateBounds();
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
        textColor: TitleOverlayTextColor = this.defaultTextColor
    ): Promise<void> {
        this.clearHideTimer();
        this.resolveAutoHide();
        this.setText(text);
        this.setTextColor(textColor);
        this.updateBounds();
        this.show();

        if (durationSeconds === undefined) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            this.autoHideResolve = resolve;
            this.hideTimer = window.setTimeout(
                () => this.hide(),
                Math.max(0, durationSeconds) * 1000
            );
        });
    }

    public override hide(): void {
        this.clearHideTimer();
        super.hide();
        this.resolveAutoHide();
    }

    private clearHideTimer(): void {
        if (this.hideTimer === null) {
            return;
        }

        window.clearTimeout(this.hideTimer);
        this.hideTimer = null;
    }

    private resolveAutoHide(): void {
        if (!this.autoHideResolve) {
            return;
        }

        const resolve = this.autoHideResolve;
        this.autoHideResolve = null;
        resolve();
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
