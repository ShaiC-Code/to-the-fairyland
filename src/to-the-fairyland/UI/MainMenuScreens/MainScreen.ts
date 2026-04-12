import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import UIScreen from "../UIScreen";

export default class MainScreen extends UIScreen {
    private mainMenuImageKey: string;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, mainMenuImageKey: string, options?: { onClickSFXKey?: string, onEnterSFXKey?: string, onExitSFXKey?: string, onShowSFXKey?: string, onHideSFXKey?: string }) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);

        this.mainMenuImageKey = mainMenuImageKey;
        this.initializeUI();
    }

    protected initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const screenTop = screenCenter.y - viewportHalfSize.y + 100;
        const screenLeft = screenCenter.x - viewportHalfSize.x + 100;
        const screenRight = screenCenter.x + viewportHalfSize.x - 100;
        const listTop = screenTop + 200;
        const listLeft = screenLeft + 100;
        const verticalOffset = 60;

        const mainMenuButtonSize = new Vec2(250, 50);
        const mainMenuButtons = [
            { key: "newGameBtn", pos: new Vec2(listLeft, listTop), text: "New Game", eventId: "level1" },
            { key: "resumeBtn", pos: new Vec2(listLeft, listTop + verticalOffset), text: "Resume", eventId: "currentLevel" },
            { key: "levelMenuBtn", pos: new Vec2(listLeft, listTop + verticalOffset * 2), text: "Level", eventId: "openLevelMenu" },
            { key: "controlsMenuBtn", pos: new Vec2(listLeft, listTop + verticalOffset * 3), text: "Controls", eventId: "openControlsMenu" },
            { key: "helpMenuBtn", pos: new Vec2(listLeft, listTop + verticalOffset * 4), text: "Help", eventId: "openHelpMenu" }
        ];
        
        // Add Main Menu background image
        this.addUIImage("mainMenuImage", new Vec2(screenCenter.x, screenCenter.y), new Vec2(viewportSize.x, viewportSize.y), this.mainMenuImageKey);

        // Add main menu buttons
        for (const button of mainMenuButtons) {
            this.addButton(button.key, button.pos, mainMenuButtonSize, button.text, {onClickEventId: button.eventId});
        }

        // Hide by default
        this.layer.setHidden(true);
    }
}
