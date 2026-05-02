import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import OverlayLayer, { OverlayLayerOptions } from "./OverlayLayer";

export type TitleOverlayOptions = OverlayLayerOptions & {
    backgroundColor?: Color;
    textColor?: Color;
    fontSize?: number;
    titleHeight?: number;
    horizontalPadding?: number;
    minTitleWidth?: number;
};

export default class TitleOverlay extends OverlayLayer {
    private readonly backgroundKey = "titleBackground";
    private readonly titleKey = "titleText";

    private readonly backgroundColor: Color;
    private readonly textColor: Color;
    private readonly fontSize: number;
    private readonly titleHeight: number;
    private readonly horizontalPadding: number;
    private readonly minTitleWidth: number;

    private titleText = "";

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
        this.textColor = options?.textColor ?? new Color(170, 0, 0, 1);
        this.fontSize = options?.fontSize ?? 64;
        this.titleHeight = options?.titleHeight ?? 160;
        this.horizontalPadding = options?.horizontalPadding ?? 80;
        this.minTitleWidth = options?.minTitleWidth ?? 400;

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
            title.textColor = this.textColor;
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

    public showTitle(text: string): void {
        this.setText(text);
        this.updateBounds();
        this.show();
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
}
