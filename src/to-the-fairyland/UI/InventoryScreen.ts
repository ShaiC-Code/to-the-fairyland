import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Color from "../../Wolfie2D/Utils/Color";
import UIScreen from "./UIScreen";
import NullFunc from "../../Wolfie2D/DataTypes/Functions/NullFunc";

export default class InventoryScreen extends UIScreen {
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

        const listTop = screenTop + 325;
        const verticalOffset = 50;

        const menuButtonSize = new Vec2(viewportSize.x, 50);

        const menuButtonPos = {
            item1: new Vec2(screenCenter.x, listTop),
            item2: new Vec2(screenCenter.x, listTop + verticalOffset),
            item3: new Vec2(screenCenter.x, listTop + verticalOffset * 2),
            item4: new Vec2(screenCenter.x, listTop + verticalOffset * 3),
            item5: new Vec2(screenCenter.x, listTop + verticalOffset * 4),
            item6: new Vec2(screenCenter.x, listTop + verticalOffset * 5)
        };


        // Add semi-transparent background
        this.addRect("bg", screenCenter.clone(), viewportHalfSize.clone().scale(2), new Color(0, 0, 0, 0.7));

        // Add info panel
        this.initializePlayerInfoComponent()

        // Add Inventory label
        this.addLabel("inventoryLabel", new Vec2(screenCenter.x, screenTop + 225), new Vec2(viewportSize.x - 200, 50), "INVENTORY", 48, {"halign": "left", "valign": "center"});

        // Add divider line
        this.addLine("divider", new Vec2(screenLeft, screenTop + 275), new Vec2(screenRight, screenTop + 275), 2);

        // Add Item buttons
        this.addHoverButton("item1Btn", menuButtonPos.item1, menuButtonSize, "ITEM 1", {onClick: NullFunc});
        this.addHoverButton("item2Btn", menuButtonPos.item2, menuButtonSize, "ITEM 2", {onClick: NullFunc});
        this.addHoverButton("item3Btn", menuButtonPos.item3, menuButtonSize, "ITEM 3", {onClick: NullFunc});
        this.addHoverButton("item4Btn", menuButtonPos.item4, menuButtonSize, "ITEM 4", {onClick: NullFunc});
        this.addHoverButton("item5Btn", menuButtonPos.item5, menuButtonSize, "ITEM 5", {onClick: NullFunc});
        this.addHoverButton("item6Btn", menuButtonPos.item6, menuButtonSize, "ITEM 6", {onClick: NullFunc});

        // Hide by default
        this.layer.setHidden(true);
    }

    private initializePlayerInfoComponent(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const screenTop = screenCenter.y - viewportHalfSize.y + 100;
        const screenLeft = screenCenter.x - viewportHalfSize.x + 100;
        const screenRight = screenCenter.x + viewportHalfSize.x - 100;

        const playerInfoSize = {
            icon: new Vec2(150, 150),
            name: new Vec2(200, 50),
            health: new Vec2(300, 10),
            healthValue: new Vec2(100, 10)
        };

        const playerInfoPos = {
            icon: new Vec2(screenLeft + 75, screenTop + 75),
            name: new Vec2(screenLeft + 300, screenTop + 50),
            health: new Vec2(screenLeft + 350, screenTop + 115),
            healthValue: new Vec2(screenLeft + 575, screenTop + 115)
        };

        // Add player icon
        this.addRect("playerIcon", playerInfoPos.icon, playerInfoSize.icon, new Color(0, 0, 150, 1));

        // Add player info labels
        this.addLabel("playerName", playerInfoPos.name, playerInfoSize.name, "FATE", 48, {"halign": "left", "valign": "center"});
        this.addRect("playerHealth", playerInfoPos.health, playerInfoSize.health, new Color(150, 0, 0, 1));
        this.addLabel("playerHealthValue", playerInfoPos.healthValue, playerInfoSize.healthValue, "100/100", 24, {"halign": "left", "valign": "center"});
    }
}
