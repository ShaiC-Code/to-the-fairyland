import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import UIScreen, { UIScreenOptions } from "../UIScreen";
import { LevelSelectionId } from "../../GameSystems/GameSessionSystem/LevelCheckpointMapping";

export default class LevelSelectionScreen extends UIScreen {
    private readonly levelNames: Map<string, string> = new Map([
        ["level1", "Epilogue"],
        ["level2", "Entering Village"],
        ["level3", "Leaving Village"],
        ["level4", "Returned to Village"],
        ["level5", "Cliff Jump"],
        ["level6", "After the Fall"],
        ["level7", "Entering Great Tree"],
        ["level8", "Leaving Great Tree"],
        ["level9", "The Desert"],
        ["level10", "Drowning"]
    ]);
    
    private unlockedLevels = new Set<LevelSelectionId>();

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);
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

        const levelButtonSize = new Vec2(viewportSize.x - 200, 50);
        const levels = Array.from(this.levelNames.keys());
        const levelButtons = levels.map((levelId, i) => ({
            key: `${levelId}Btn`,
            pos: new Vec2(screenCenter.x, listTop + verticalOffset * i),
            text: this.levelNames.get(levelId) || `Level ${i + 1}`,
            eventId: levelId
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

    public setUnlockedLevels(unlockedLevels: Set<LevelSelectionId>): void {
        this.unlockedLevels = unlockedLevels;
        for (const levelId of this.levelNames.keys()) {
            const buttonKey = `${levelId}Btn`;
            const isUnlocked = this.unlockedLevels.has(levelId as LevelSelectionId);
            this.setUIElementEnabled(buttonKey, isUnlocked);
        }
    }
}
