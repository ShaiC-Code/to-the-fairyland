import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Layer from "../../Wolfie2D/Scene/Layer";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { CustomUIElementType } from "../UI/CustomUIElements/CustomUIElementTypes";
import Color from "../../Wolfie2D/Utils/Color";
import Label, { VAlign, HAlign} from "../../Wolfie2D/Nodes/UIElements/Label";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Line from "../../Wolfie2D/Nodes/Graphics/Line";
import CanvasNode from "../../Wolfie2D/Nodes/CanvasNode";
import Updateable from "../../Wolfie2D/DataTypes/Interfaces/Updateable";

export default class OverlayLayer implements Updateable {
    protected scene: Scene;
    protected getViewportCenter: () => Vec2;
    protected getViewportHalfSize: () => Vec2;

    protected static readonly defaultDepth: number = 9999;

    protected layerName: string;
    protected layer: Layer;
    protected elements: Map<string, CanvasNode | undefined>;
    protected isVisible: boolean = false;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, depth: number = OverlayLayer.defaultDepth) {
        this.scene = scene;
        this.getViewportCenter = getViewportCenter;
        this.getViewportHalfSize = getViewportHalfSize;
        this.layerName = layerName;
        this.layer = this.scene.addParallaxLayer(layerName, Vec2.ZERO, depth);

        this.elements = new Map();
    }

    protected initializeOverlay(): void {}

    protected updateOverlayElement(element: CanvasNode | undefined, position: Vec2 | null, size: Vec2 | null): void {
      if (element) {
        if (position) {
          element.position.copy(position);
        }
        if (size) {
          element.size.copy(size);
        }
      }
    }

    private addOverlayElement(key: string, element: CanvasNode): void {
        this.elements.set(key, element);
    }

    public getOverlayElement(key: string): CanvasNode | undefined {
        return this.elements.get(key);
    }

    public update(deltaT: number): void {
        if (!this.isVisible) {
            return;
        }
    }
    
    public show(): void {
        this.isVisible = true;
        this.layer.setHidden(false);
    }

    public hide(): void {
        this.isVisible = false;
        this.layer.setHidden(true);
    }

    public getIsVisible(): boolean {
        return this.isVisible;
    }

    public destroy(): void {
        if (this.layer) {
            this.layer.setHidden(true);
        }
        this.isVisible = false;
    }

    protected addRect(key: string, position: Vec2, size: Vec2, color: Color): void {
        const rect = this.scene.add.graphic(GraphicType.RECT, this.layerName, {
            position: position,
            size: size
        });
        rect.color = color;
        this.addOverlayElement(key, rect);
    }

    protected addLine(key: string, start: Vec2, end: Vec2, thickness: number): void {
        const divider = <Line>this.scene.add.graphic(GraphicType.LINE, this.layerName, {
            start: start,
            end: end
        });
        divider.color = Color.WHITE;
        divider.thickness = thickness;
        this.addOverlayElement(key, divider);
    }
    
    protected addLabel(key: string, position: Vec2, size: Vec2, text: string, fontSize: number, options?: {halign?: string, valign?: string}): void {
        const { halign, valign } = options ?? {};

        const label = <Label>this.scene.add.uiElement(UIElementType.LABEL, this.layerName, {
            position: position,
            text: text
        });
        label.size.set(size.x, size.y);
        label.fontSize = fontSize;
        label.textColor = Color.WHITE;
        label.backgroundColor = Color.TRANSPARENT;
        label.borderColor = Color.TRANSPARENT;
        if (halign && Object.keys(HAlign).some(key => HAlign[key as keyof typeof HAlign] === halign)) {
            label.setHAlign(halign);
        }
        if (valign && Object.keys(VAlign).some(key => VAlign[key as keyof typeof VAlign] === valign)) {
            label.setVAlign(valign);
        }
        this.addOverlayElement(key, label);
    }

    protected addUIImage(key: string, position: Vec2, size: Vec2, imageKey: string): void {
        const imageElement = this.scene.add.customCanvasNode(CustomUIElementType.UI_IMAGE, this.layerName, {
            imageKey
        });
        imageElement.position.copy(position);
        const scaleX = imageElement.size.x !== 0 ? size.x / imageElement.size.x : 1;
        const scaleY = imageElement.size.y !== 0 ? size.y / imageElement.size.y : 1;
        imageElement.scale.set(scaleX, scaleY);
        this.addOverlayElement(key, imageElement);
    }

    protected addSpotlightOverlay(key: string, position: Vec2, size: Vec2, radius: number, innerRadiusRatio: number, overlayColor: Color): void {
        const spotlightOverlay = this.scene.add.customCanvasNode(CustomUIElementType.SPOTLIGHT_OVERLAY, this.layerName, {
            position: position,
            size: size,
            radius: radius,
            innerRadiusRatio: innerRadiusRatio,
            overlayColor: overlayColor
        });
        this.addOverlayElement(key, spotlightOverlay);
    }
}