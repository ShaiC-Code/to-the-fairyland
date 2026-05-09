import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import UIScreen, { UIScreenOptions } from "../UIScreen";
import HoverButton from "../CustomUIElements/HoverButton";
import Button from "../../../Wolfie2D/Nodes/UIElements/Button";

export default class MainScreen extends UIScreen {
    private mainMenuImageKey: string;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, mainMenuImageKey: string, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);
        this.mainMenuImageKey = mainMenuImageKey;
        this.initializeUI();
    }

    protected override initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const screenTop = screenCenter.y - viewportHalfSize.y + 100;
        const screenLeft = screenCenter.x - viewportHalfSize.x + 100;
        const screenRight = screenCenter.x + viewportHalfSize.x - 100;
        const listTop = screenTop + 200;
        const listLeft = screenLeft + 200;
        const verticalOffset = 60;

        const mainMenuButtonSize = new Vec2(525, 50);
        const mainMenuButtons = [
            { key: "newGameBtn", pos: new Vec2(listLeft, listTop), text: "NEW GAME", eventId: "newGame" },
            { key: "resumeBtn", pos: new Vec2(listLeft, listTop + verticalOffset), text: "RESUME", eventId: "currentLevel" },
            { key: "levelMenuBtn", pos: new Vec2(listLeft, listTop + verticalOffset * 2), text: "LEVEL SELECT", eventId: "openLevelMenu" },
            { key: "controlsMenuBtn", pos: new Vec2(listLeft, listTop + verticalOffset * 3), text: "CONTROLS", eventId: "openControlsMenu" },
            { key: "helpMenuBtn", pos: new Vec2(listLeft, listTop + verticalOffset * 4), text: "HELP", eventId: "openHelpMenu" }
        ];
        
        // Add Main Menu background image
        this.addUIImage("mainMenuImage", new Vec2(screenCenter.x, screenCenter.y), new Vec2(viewportSize.x, viewportSize.y), this.mainMenuImageKey);

        // Add main menu buttons
        for (const button of mainMenuButtons) {
            this.addHoverButton(button.key, button.pos, mainMenuButtonSize, button.text, {onClickEventId: button.eventId});
            const currentBtn = this.getUIElement(button.key) as HoverButton;
            currentBtn.fontSize = 40;
            currentBtn.setHAlign("center");
            currentBtn.setVAlign("center");
        }

        this.setNavigationButtons(mainMenuButtons.map(button => button.key));

        // Hide by default
        this.layer.setHidden(true);
    }

    public setResumeEnabled(enabled: boolean): void {
        const resumeButton = this.getUIElement("resumeBtn") as Button | undefined;

        if (!resumeButton) {
            return;
        }

        resumeButton.setEnabled(enabled);
    }
}
