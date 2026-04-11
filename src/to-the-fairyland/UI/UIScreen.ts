import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Layer from "../../Wolfie2D/Scene/Layer";
import UIElement from "../../Wolfie2D/Nodes/UIElement";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { CustomUIElementType } from "./CustomUIElements/CustomUIElementTypes";
import Color from "../../Wolfie2D/Utils/Color";
import Label, { VAlign, HAlign} from "../../Wolfie2D/Nodes/UIElements/Label";

export default class UIScreen {
    protected scene: Scene;
    protected getViewportCenter: () => Vec2;
    protected getViewportHalfSize: () => Vec2;

    protected layerName: string;
    protected layer: Layer;
    protected elements: Map<string, UIElement | undefined>;
    protected isOpen: boolean = false;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2) {
        this.scene = scene;
        this.getViewportCenter = getViewportCenter;
        this.getViewportHalfSize = getViewportHalfSize;
        this.layerName = layerName;
        this.layer = this.scene.addUILayer(layerName);
        this.elements = new Map();
    }

    protected initializeUI(): void {}

    protected updateLayout(): void {}

    protected updateUIElement(element: UIElement | undefined, position: Vec2 | null, size: Vec2 | null): void {
      if (element) {
        if (position) {
          element.position.copy(position);
        }
        if (size) {
          element.size.copy(size);
        }
      }
    }

    private addUIElement(key: string, element: UIElement): void {
        this.elements.set(key, element);
    }
    
    public show(): void {
        if (this.isOpen) return;
        this.isOpen = true;

        this.updateLayout();

        this.layer.setHidden(false);
    }

    public hide(): void {
        if (!this.isOpen) return;
        this.isOpen = false;

        this.layer.setHidden(true);
    }

    public getIsOpen(): boolean {
        return this.isOpen;
    }

    public destroy(): void {
        if (this.layer) {
            this.layer.setHidden(true);
        }
        this.isOpen = false;
    }
    
    protected addLabel(key: string, position: Vec2, size: Vec2, text: string, fontSize: number, valign: string, halign: string): void {
        const label = <Label>this.scene.add.uiElement(UIElementType.LABEL, this.layerName, {
            position: position,
            text: text
        });
        label.size.set(size.x, size.y);
        label.fontSize = fontSize;
        label.textColor = Color.WHITE;
        label.backgroundColor = Color.TRANSPARENT;
        label.borderColor = Color.TRANSPARENT;
        if (valign && Object.keys(VAlign).some(key => VAlign[key as keyof typeof VAlign] === valign)) {
            label.setVAlign(valign);
        }
        if (halign && Object.keys(HAlign).some(key => HAlign[key as keyof typeof HAlign] === halign)) {
            label.setHAlign(halign);
        }
        this.addUIElement(key, label);
    }
    
    protected addButton(key: string, position: Vec2, size: Vec2, text: string, onClick: () => void): void {
        const button = this.scene.add.uiElement(UIElementType.BUTTON, this.layerName, {
            position: position,
            text: text
        });
        button.size.set(size.x, size.y);
        button.borderWidth = 2;
        button.borderColor = Color.WHITE;
        button.backgroundColor = Color.TRANSPARENT;
        button.onClick = onClick;
        this.addUIElement(key, button);
    }
    
    protected addHoverButton(key: string, position: Vec2, size: Vec2, text: string, onClick: () => void): void {
        const button = this.scene.add.uiElement(CustomUIElementType.HOVER_BUTTON, this.layerName, {
            position: position,
            text: text
        });
        button.size.set(size.x, size.y);
        button.borderWidth = 0;
        button.borderRadius = 0;
        button.onClick = onClick;
        this.addUIElement(key, button);
    }
}