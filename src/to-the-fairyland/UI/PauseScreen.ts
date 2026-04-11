import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Color from "../../Wolfie2D/Utils/Color";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import UIScreen from "./UIScreen";

export default class PauseScreen extends UIScreen {
    private onQuit: () => void;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, onQuit: () => void) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize);
        this.onQuit = onQuit;

        this.initializeUI();
    }

    protected initializeUI(): void {
        // Add semi-transparent background
        const bg = <Label>this.scene.add.uiElement(UIElementType.LABEL, "pauseOverlay", {
            position: Vec2.ZERO,
            text: ""
        });
        bg.backgroundColor = new Color(0, 0, 0, 0.7);
        bg.borderColor = Color.TRANSPARENT;
        bg.borderRadius = 0;

        // Add "PAUSED" text
        const pausedLabel = <Label>this.scene.add.uiElement(UIElementType.LABEL, "pauseOverlay", {
            position: Vec2.ZERO,
            text: "PAUSED"
        });
        pausedLabel.fontSize = 64;
        pausedLabel.textColor = Color.WHITE;
        pausedLabel.backgroundColor = Color.TRANSPARENT;
        pausedLabel.borderColor = Color.TRANSPARENT;

        // Add Resume button
        const resumeBtn = <Label>this.scene.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
            position: Vec2.ZERO,
            text: "Resume"
        });
        resumeBtn.size.set(250, 50);
        resumeBtn.fontSize = 24;
        resumeBtn.textColor = Color.WHITE;
        resumeBtn.borderColor = Color.WHITE;
        resumeBtn.borderWidth = 2;
        resumeBtn.backgroundColor = Color.TRANSPARENT;
        resumeBtn.borderRadius = 0;
        resumeBtn.onClick = () => this.hide();

        // Add Quit to Menu button
        const quitBtn = <Label>this.scene.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
            position: Vec2.ZERO,
            text: "Quit to Menu"
        });
        quitBtn.size.set(250, 50);
        quitBtn.fontSize = 24;
        quitBtn.textColor = Color.WHITE;
        quitBtn.borderColor = Color.WHITE;
        quitBtn.borderWidth = 2;
        quitBtn.backgroundColor = Color.TRANSPARENT;
        quitBtn.borderRadius = 0;
        quitBtn.onClick = () => this.onQuit();

        this.elements.set("bg", bg);
        this.elements.set("pausedLabel", pausedLabel);
        this.elements.set("resumeBtn", resumeBtn);
        this.elements.set("quitBtn", quitBtn);

        this.updateLayout();

        // Hide by default
        this.layer.setHidden(true);
    }

    protected updateLayout(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const screenCenter = viewportHalfSize.clone();

        this.updateUIElement(this.elements.get("bg"), screenCenter.clone(), viewportHalfSize.clone().scale(2));
        this.updateUIElement(this.elements.get("pausedLabel"), new Vec2(screenCenter.x, screenCenter.y - 100), null);
        this.updateUIElement(this.elements.get("resumeBtn"), new Vec2(screenCenter.x, screenCenter.y + 50), null);
        this.updateUIElement(this.elements.get("quitBtn"), new Vec2(screenCenter.x, screenCenter.y + 120), null);
    }
}
