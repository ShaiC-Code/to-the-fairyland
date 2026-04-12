import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import UIScreen from "./UIScreen";
import Color from "../../Wolfie2D/Utils/Color";
import NullFunc from "../../Wolfie2D/DataTypes/Functions/NullFunc";

export default class PauseScreen extends UIScreen {
    private onQuit: () => void;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, onQuit: () => void, options?: { onClickSFXKey?: string, onEnterSFXKey?: string, onExitSFXKey?: string }) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);
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
        this.addRect("bg", screenCenter.clone(), viewportHalfSize.clone().scale(2), new Color(0, 0, 0, 0.7));

        // Add "PAUSED" text
        // this.addLabel("pausedLabel", menuButtonPos.pause, new Vec2(viewportSize.x, 100), "PAUSED", 64, {"halign": "left", "valign": "center"});

        // Add Resume button
        this.addHoverButton("resumeBtn", menuButtonPos.resume, menuButtonSize, "RESUME", {onClick: () => this.hide()});

        // Add Save button
        this.addHoverButton("saveBtn", menuButtonPos.save, menuButtonSize, "SAVE", {onClick: NullFunc});

        // Add Volume button
        this.addHoverButton("volumeBtn", menuButtonPos.volume, menuButtonSize, "VOLUME", {onClick: NullFunc});

        // Add Quit button
        this.addHoverButton("quitBtn", menuButtonPos.quit, menuButtonSize, "BACK TO MENU", {onClick: () => this.onQuit()});

        // Hide by default
        this.layer.setHidden(true);
    }
}
