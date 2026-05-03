import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import UIScreen, { UIScreenOptions } from "../UIScreen";
import AudioController from "../../GameSystems/AudioController";

export default class LevelSelectionScreen extends UIScreen {
    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, audioController: AudioController, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, audioController, options);
        this.initializeUI();
    }

    protected override initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const screenTop = screenCenter.y - viewportHalfSize.y + 100;
        const screenLeft = screenCenter.x - viewportHalfSize.x + 100;
        const screenRight = screenCenter.x + viewportHalfSize.x - 100;
        const listTop = screenTop + 120;
        const verticalOffset = 60;

        const levelButtonSize = new Vec2(viewportSize.x, 50);
        const levelButtons = Array.from({ length: 10 }, (_, i) => ({
            key: `level${i + 1}Btn`,
            pos: new Vec2(screenCenter.x, listTop + verticalOffset * i),
            text: `LEVEL ${i + 1}`,
            eventId: `level${i + 1}`
        }));
        
        levelButtons.push({
            key: "backBtn",
            pos: new Vec2(screenCenter.x, listTop + verticalOffset * levelButtons.length),
            text: "BACK",
            eventId: "backToMain"
        });
        
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
