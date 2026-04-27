import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import UIScreen, { UIScreenOptions } from "./UIScreen";
import Color from "../../Wolfie2D/Utils/Color";
import NullFunc from "../../Wolfie2D/DataTypes/Functions/NullFunc";

export default class PauseScreen extends UIScreen {
    private onControls: () => void;
    private onQuit: () => void;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, onControls: () => void, onQuit: () => void, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);
        this.onControls = onControls;
        this.onQuit = onQuit;

        this.initializeUI();
    }

    protected override initializeUI(): void {
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
            controls: new Vec2(screenCenter.x, listTop + verticalOffset * 3),
            quit: new Vec2(screenCenter.x, listTop + verticalOffset * 4)
        };

        // Add semi-transparent background
        this.addRect("bg", screenCenter.clone(), viewportHalfSize.clone().scale(2), new Color(0, 0, 0, 0.7));

        // Add Resume button
        this.addHoverButton("resumeBtn", menuButtonPos.resume, menuButtonSize, "RESUME", {onClick: () => this.hide()});

        // Add Save button
        this.addHoverButton("saveBtn", menuButtonPos.save, menuButtonSize, "SAVE", {onClick: NullFunc});

        // Add Volume button
        this.addHoverButton("volumeBtn", menuButtonPos.volume, menuButtonSize, "VOLUME", {onClick: NullFunc});

        // Add Volume button
        this.addHoverButton("controlsBtn", menuButtonPos.controls, menuButtonSize, "CONTROLS", {onClick: () => this.onControls()});

        // Add Quit button
        this.addHoverButton("quitBtn", menuButtonPos.quit, menuButtonSize, "BACK TO MENU", {onClick: () => this.onQuit()});

        this.setNavigationButtons([
            "resumeBtn",
            "saveBtn",
            "volumeBtn",
            "controlsBtn",
            "quitBtn"
        ]);

        // Hide by default
        this.layer.setHidden(true);
    }
}
