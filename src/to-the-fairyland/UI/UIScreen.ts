import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Layer from "../../Wolfie2D/Scene/Layer";
import UIElement from "../../Wolfie2D/Nodes/UIElement";

export default class UIScreen {
    protected scene: Scene;
    protected getViewportCenter: () => Vec2;
    protected getViewportHalfSize: () => Vec2;

    protected layer: Layer;
    protected elements: Map<string, UIElement | undefined>;
    protected isOpen: boolean = false;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2) {
        this.scene = scene;
        this.getViewportCenter = getViewportCenter;
        this.getViewportHalfSize = getViewportHalfSize;
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
}