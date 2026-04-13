import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import UIScreen, { UIScreenOptions } from "../UIScreen";

export default class TestScreen extends UIScreen {

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);

        this.initializeUI();
    }

    protected initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const screenTop = screenCenter.y - viewportHalfSize.y + 100;
        const screenLeft = screenCenter.x - viewportHalfSize.x + 100;
        const screenRight = screenCenter.x + viewportHalfSize.x - 100;
        const listTop = screenTop + 80;

        // Add Testing label
        this.addLabel("testingLabel", new Vec2(screenCenter.x, screenTop), new Vec2(viewportSize.x - 200, 50), "TESTING", 48, {"halign": "left", "valign": "center"});

        // Add divider line
        this.addLine("testingDivider", new Vec2(screenLeft, screenTop + 40), new Vec2(screenRight, screenTop + 40), 2);

        // Add demo text box to show word wrap behavior
        this.addTextBox(
            "demoTextBox",
            new Vec2(screenCenter.x, listTop + 120),
            new Vec2(760, 240),
            "This is a very long sentence to test textbox word wrap behavior and see whether it wraps to multiple lines automatically when the text exceeds the available width.",
            24,
            {halign: "left", valign: "top", maxLines: 8}
        );

        this.addLabel(
            "cheatCodesLabel",
            new Vec2(screenCenter.x, listTop + 300),
            new Vec2(760, 40),
            "Cheat Codes: Placeholder...",
            28,
            {"halign": "left", "valign": "center"}
        );

        const buttonSize = new Vec2(280, 60);
        const buttonsY = listTop + 380;
        const buttonsGap = 40;
        const buttonOffsetX = (buttonSize.x / 2) + (buttonsGap / 2);

        this.addButton(
            "goBackBtn",
            new Vec2(screenCenter.x - buttonOffsetX, buttonsY),
            buttonSize,
            "Go Back",
            { onClickEventId: "openHelpMenu" }
        );

        this.addButton(
            "mainMenuBtn",
            new Vec2(screenCenter.x + buttonOffsetX, buttonsY),
            buttonSize,
            "Main Menu",
            { onClickEventId: "backToMain" }
        );

        this.setNavigationButtons([
            "goBackBtn",
            "mainMenuBtn"
        ]);

        // Hide by default
        this.layer.setHidden(true);
    }
}
