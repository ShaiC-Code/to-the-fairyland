import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Color from "../../Wolfie2D/Utils/Color";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import UIScreen from "./UIScreen";

export default class InventoryScreen extends UIScreen {
    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize);

        this.initializeUI();
    }

    protected initializeUI(): void {
      // Add semi-transparent background
        const bg = <Label>this.scene.add.uiElement(UIElementType.LABEL, "inventoryOverlay", {
            position: Vec2.ZERO,
            text: ""
        });
        bg.backgroundColor = new Color(0, 0, 0, 0.7);
        bg.borderColor = Color.TRANSPARENT;
        bg.borderRadius = 0;

        // Add "INVENTORY" title
        const titleLabel = <Label>this.scene.add.uiElement(UIElementType.LABEL, "inventoryOverlay", {
            position: Vec2.ZERO,
            text: "INVENTORY"
        });
        titleLabel.fontSize = 52;
        titleLabel.textColor = Color.WHITE;
        titleLabel.backgroundColor = Color.TRANSPARENT;
        titleLabel.borderColor = Color.TRANSPARENT;

        // Add inventory content area
        const contentLabel = <Label>this.scene.add.uiElement(UIElementType.LABEL, "inventoryOverlay", {
            position: Vec2.ZERO,
            text: "No items yet"
        });
        contentLabel.fontSize = 24;
        contentLabel.textColor = Color.WHITE;
        contentLabel.backgroundColor = new Color(40, 40, 40, 0.8);
        contentLabel.borderColor = Color.WHITE;
        contentLabel.borderWidth = 2;
        contentLabel.borderRadius = 0;
        contentLabel.size.set(300, 150);

        // Add Close button
        const closeBtn = <Label>this.scene.add.uiElement(UIElementType.BUTTON, "inventoryOverlay", {
            position: Vec2.ZERO,
            text: "Close (C)"
        });
        closeBtn.size.set(200, 50);
        closeBtn.fontSize = 24;
        closeBtn.textColor = Color.WHITE;
        closeBtn.borderColor = Color.WHITE;
        closeBtn.borderWidth = 2;
        closeBtn.backgroundColor = Color.TRANSPARENT;
        closeBtn.borderRadius = 0;
        closeBtn.onClick = () => this.hide();

        this.elements.set("bg", bg);
        this.elements.set("titleLabel", titleLabel);
        this.elements.set("contentLabel", contentLabel);
        this.elements.set("closeBtn", closeBtn);

        this.updateLayout();

        // Hide by default
        this.layer.setHidden(true);
    }

    protected updateLayout(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const screenCenter = viewportHalfSize.clone();

        this.updateUIElement(this.elements.get("bg"), screenCenter.clone(), viewportHalfSize.clone().scale(2));
        this.updateUIElement(this.elements.get("titleLabel"), new Vec2(screenCenter.x, screenCenter.y - 150), null);
        this.updateUIElement(this.elements.get("contentLabel"), new Vec2(screenCenter.x, screenCenter.y - 20), null);
        this.updateUIElement(this.elements.get("closeBtn"), new Vec2(screenCenter.x, screenCenter.y + 150), null);
    }
}
