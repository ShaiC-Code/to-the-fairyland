import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import UIScreen, { UIScreenOptions } from "../UIScreen";

export default class LevelSelectionScreen extends UIScreen {

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
        const listTop = screenTop + 120;
        const verticalOffset = 60;

        const levelButtonSize = new Vec2(viewportSize.x, 50);
        const levelButtons = [
            { key: "level1Btn", pos: new Vec2(screenCenter.x, listTop), text: "LEVEL 1", eventId: "level1" },
            { key: "level2Btn", pos: new Vec2(screenCenter.x, listTop + verticalOffset), text: "LEVEL 2", eventId: "level2" },
            { key: "level3Btn", pos: new Vec2(screenCenter.x, listTop + verticalOffset * 2), text: "LEVEL 3", eventId: "level3" },
            { key: "level4Btn", pos: new Vec2(screenCenter.x, listTop + verticalOffset * 3), text: "LEVEL 4", eventId: "level4" },
            { key: "level5Btn", pos: new Vec2(screenCenter.x, listTop + verticalOffset * 4), text: "LEVEL 5", eventId: "level5" },
            { key: "level6Btn", pos: new Vec2(screenCenter.x, listTop + verticalOffset * 5), text: "LEVEL 6", eventId: "level6" },
            { key: "backBtn", pos: new Vec2(screenCenter.x, listTop + verticalOffset * 6), text: "BACK", eventId: "backToMain" }
        ];
        
        // Add Level Select label
        this.addLabel("levelMenuLabel", new Vec2(screenCenter.x, screenTop), new Vec2(viewportSize.x - 200, 50), "LEVEL SELECT", 48, {"halign": "left", "valign": "center"});

        // Add divider line
        this.addLine("divider", new Vec2(screenLeft, screenTop + 40), new Vec2(screenRight, screenTop + 40), 2);

        // Add level buttons
        for (const button of levelButtons) {
            this.addHoverButton(button.key, button.pos, levelButtonSize, button.text, {onClickEventId: button.eventId});
        }

        this.setNavigationButtons(levelButtons.map(button => button.key));

        // Hide by default
        this.layer.setHidden(true);
    }
}
