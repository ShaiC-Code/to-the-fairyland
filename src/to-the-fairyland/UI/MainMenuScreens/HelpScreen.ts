import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import UIScreen from "../UIScreen";

export default class HelpScreen extends UIScreen {

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize);

        this.initializeUI();
    }

    protected initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const screenTop = screenCenter.y - viewportHalfSize.y + 100;
        const screenLeft = screenCenter.x - viewportHalfSize.x + 100;
        const screenRight = screenCenter.x + viewportHalfSize.x - 100;
        const listTop = screenTop + 120;
        const verticalOffset = 100;

        const helpButtonSize = new Vec2(250, 50);
        const helpButtons = [
            { key: "howToPlayBtn", pos: new Vec2(screenCenter.x, listTop), text: "How to Play", eventId: "openControlsMenu" },
            { key: "controlsBtn", pos: new Vec2(screenCenter.x, listTop + verticalOffset), text: "Controls", eventId: "openControlsMenu" },
            { key: "backBtn", pos: new Vec2(screenCenter.x, listTop + verticalOffset * 2), text: "Back", eventId: "backToMain" }
        ];

        // Add Help label
        this.addLabel("helpMenuLabel", new Vec2(screenCenter.x, screenTop), new Vec2(viewportSize.x - 200, 50), "HELP", 48, {"halign": "left", "valign": "center"});

        // Add divider line
        this.addLine("divider", new Vec2(screenLeft, screenTop + 40), new Vec2(screenRight, screenTop + 40), 2);

        // Add help buttons
        for (const button of helpButtons) {
            this.addButton(button.key, button.pos, helpButtonSize, button.text, {onClickEventId: button.eventId});
        }

        // Add demo text box to show word wrap behavior
        this.addTextBox(
          "demoTextBox",
          new Vec2(screenCenter.x, screenCenter.y + 300),
          new Vec2(720, 240),
          "This is a very long sentence to test textbox word wrap behavior and see whether it wraps to multiple lines automatically when the text exceeds the available width.",
          24,
          {halign: "left", valign: "top", maxLines: 8}
        );

        // Hide by default
        this.layer.setHidden(true);
    }
}
