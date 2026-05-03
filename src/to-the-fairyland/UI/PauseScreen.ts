import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import UIScreen, { UIScreenOptions } from "./UIScreen";
import Color from "../../Wolfie2D/Utils/Color";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import EaseFunctions from "../../Wolfie2D/Utils/EaseFunctions";
import AudioController from "../GameSystems/AudioController";

export default class PauseScreen extends UIScreen {
    private onControls: () => void;
    private onSave: () => void;
    private onQuit: () => void;

    private saveConfirmationLabel?: Label;
    private saveConfirmationElapsed = 0;
    private saveConfirmationAnimating = false;
    private readonly savePopDuration = 0.2;
    private readonly saveHoldDuration = 0.5;
    private readonly saveFadeDuration = 0.3;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, audioController: AudioController, onControls: () => void, onSave: () => void, onQuit: () => void, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, audioController, options);
        this.onControls = onControls;
        this.onSave = onSave;
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

        this.addLabel(
            "saveConfirmation",
            new Vec2(screenCenter.x, screenCenter.y - 180),
            new Vec2(420, 70),
            "GAME SAVED",
            36,
            {halign: "center", valign: "center"}
        );
        this.saveConfirmationLabel = this.getUIElement("saveConfirmation") as Label;
        this.saveConfirmationLabel.fontSize = 36;
        this.saveConfirmationLabel.textColor = Color.YELLOW;
        this.saveConfirmationLabel.backgroundColor = Color.TRANSPARENT;
        this.saveConfirmationLabel.borderColor = Color.TRANSPARENT;
        this.saveConfirmationLabel.alpha = 0;
        this.saveConfirmationLabel.scale.set(0.75, 0.75);

        // Add Resume button
        this.addHoverButton("resumeBtn", menuButtonPos.resume, menuButtonSize, "RESUME", {onClick: () => this.hide()});

        // Add Save button
        this.addHoverButton("saveBtn", menuButtonPos.save, menuButtonSize, "SAVE", {onClick: () => {
            this.onSave();
            this.showSaveConfirmation();
        }});

        // Add Volume button
        this.addHoverButton("volumeBtn", menuButtonPos.volume, menuButtonSize, "VOLUME", {onClick: () => {}});

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

    private showSaveConfirmation(): void {
        if (!this.saveConfirmationLabel) return;
        this.saveConfirmationElapsed = 0;
        this.saveConfirmationAnimating = true;
        this.saveConfirmationLabel.alpha = 0;
        this.saveConfirmationLabel.scale.set(0.75, 0.75);
    }

    public override update(deltaT: number): void {
        super.update(deltaT);

        if (!this.saveConfirmationAnimating || !this.saveConfirmationLabel) {
            return;
        }

        this.saveConfirmationElapsed += deltaT;

        const popEnd = this.savePopDuration;
        const holdEnd = popEnd + this.saveHoldDuration;
        const fadeEnd = holdEnd + this.saveFadeDuration;

        if (this.saveConfirmationElapsed <= popEnd) {
            const t = this.saveConfirmationElapsed / this.savePopDuration;
            const eased = EaseFunctions.easeOutSine(t);
            this.saveConfirmationLabel.alpha = this.lerp(0, 1, eased);
            const scale = this.lerp(0.75, 1.08, eased);
            this.saveConfirmationLabel.scale.set(scale, scale);
            return;
        }

        if (this.saveConfirmationElapsed <= holdEnd) {
            this.saveConfirmationLabel.alpha = 1;
            this.saveConfirmationLabel.scale.set(1.08, 1.08);
            return;
        }

        if (this.saveConfirmationElapsed <= fadeEnd) {
            const t = (this.saveConfirmationElapsed - holdEnd) / this.saveFadeDuration;
            const eased = EaseFunctions.easeInOutQuad(t);
            this.saveConfirmationLabel.alpha = this.lerp(1, 0, eased);
            const scale = this.lerp(1.08, 0.92, eased);
            this.saveConfirmationLabel.scale.set(scale, scale);
            return;
        }

        this.saveConfirmationLabel.alpha = 0;
        this.saveConfirmationLabel.scale.set(0.92, 0.92);
        this.saveConfirmationAnimating = false;
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }
}
