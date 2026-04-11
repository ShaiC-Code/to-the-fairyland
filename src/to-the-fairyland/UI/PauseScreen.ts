import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import UIScreen from "./UIScreen";
import Color from "../../Wolfie2D/Utils/Color";

export default class PauseScreen extends UIScreen {
    private onQuit: () => void;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, onQuit: () => void) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize);
        this.onQuit = onQuit;

        this.initializeUI();
    }

    protected initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const listTop = screenCenter.y + 50;
        const verticalOffset = 50;

        const menuButtonSize = new Vec2(viewportSize.x, 50);

        const menuButtonPos = {
            pause: new Vec2(screenCenter.x, screenCenter.y - 100),
            resume: new Vec2(screenCenter.x, listTop),
            save: new Vec2(screenCenter.x, listTop + verticalOffset),
            volume: new Vec2(screenCenter.x, listTop + verticalOffset * 2),
            quit: new Vec2(screenCenter.x, listTop + verticalOffset * 3)
        };


        // Add semi-transparent background
        this.addLabel("bg", screenCenter.clone(), viewportHalfSize.clone().scale(2), "", 0, "center", "center");
        this.elements.get("bg")!.backgroundColor = new Color(0, 0, 0, 0.7);

        // Add "PAUSED" text
        // this.addLabel("pausedLabel", menuButtonPos.pause, new Vec2(viewportSize.x, 100), "PAUSED", 64, "center", "center");

        // Add Resume button
        this.addHoverButton("resumeBtn", menuButtonPos.resume, menuButtonSize, "RESUME", () => this.hide());

        // Add Save button
        this.addHoverButton("saveBtn", menuButtonPos.save, menuButtonSize, "SAVE", () => {});

        // Add Volume button
        this.addHoverButton("volumeBtn", menuButtonPos.volume, menuButtonSize, "VOLUME", () => {});

        // Add Quit button
        this.addHoverButton("quitBtn", menuButtonPos.quit, menuButtonSize, "BACK TO MENU", () => this.onQuit());

        // Hide by default
        this.layer.setHidden(false);
    }
}
