import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Color from "../../Wolfie2D/Utils/Color";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import UIScreen from "./UIScreen";
import NullFunc from "../../Wolfie2D/DataTypes/Functions/NullFunc";
import Inventory from "../GameSystems/ItemSystem/Inventory";

export default class InventoryScreen extends UIScreen {
    private readonly inventory: Inventory;
    private readonly itemButtonKeys = [
        "item1Btn",
        "item2Btn",
        "item3Btn",
        "item4Btn",
        "item5Btn",
        "item6Btn"
    ];

    constructor(
        layerName: string,
        scene: Scene,
        getViewportCenter: () => Vec2,
        getViewportHalfSize: () => Vec2,
        inventory: Inventory,
        options?: { onClickSFXKey?: string, onEnterSFXKey?: string, onExitSFXKey?: string, onShowSFXKey?: string, onHideSFXKey?: string }
    ) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);
        this.inventory = inventory;
        this.initializeUI();
        this.refreshItems();
    }

    public override show(): void {
        this.refreshItems();
        super.show();
    }

    private refreshItems(): void {
        const items = Array.from(this.inventory.items());

        for (let i = 0; i < this.itemButtonKeys.length; i++) {
            const button = this.getUIElement(this.itemButtonKeys[i]) as Button;
            const item = items[i];

            if (item) {
                button.text = item.displayName();
                button.visible = true;
            } else {
                button.text = "";
                button.visible = false;
            }
        }
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

        this.addRect("bg", screenCenter.clone(), viewportHalfSize.clone().scale(2), new Color(0, 0, 0, 0.7));
        this.initializePlayerInfoComponent();
        this.addLabel("inventoryLabel", new Vec2(screenCenter.x, screenTop + 225), new Vec2(viewportSize.x - 200, 50), "INVENTORY", 48, { halign: "left", valign: "center" });
        this.addLine("divider", new Vec2(screenLeft, screenTop + 275), new Vec2(screenRight, screenTop + 275), 2);

        this.addHoverButton("item1Btn", menuButtonPos.item1, menuButtonSize, "", { onClick: NullFunc });
        this.addHoverButton("item2Btn", menuButtonPos.item2, menuButtonSize, "", { onClick: NullFunc });
        this.addHoverButton("item3Btn", menuButtonPos.item3, menuButtonSize, "", { onClick: NullFunc });
        this.addHoverButton("item4Btn", menuButtonPos.item4, menuButtonSize, "", { onClick: NullFunc });
        this.addHoverButton("item5Btn", menuButtonPos.item5, menuButtonSize, "", { onClick: NullFunc });
        this.addHoverButton("item6Btn", menuButtonPos.item6, menuButtonSize, "", { onClick: NullFunc });

        this.layer.setHidden(true);
    }

    private initializePlayerInfoComponent(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const screenTop = screenCenter.y - viewportHalfSize.y + 100;
        const screenLeft = screenCenter.x - viewportHalfSize.x + 100;

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

        this.addRect("playerIcon", playerInfoPos.icon, playerInfoSize.icon, new Color(0, 0, 150, 1));
        this.addLabel("playerName", playerInfoPos.name, playerInfoSize.name, "FATE", 48, { halign: "left", valign: "center" });
        this.addRect("playerHealth", playerInfoPos.health, playerInfoSize.health, new Color(150, 0, 0, 1));
        this.addLabel("playerHealthValue", playerInfoPos.healthValue, playerInfoSize.healthValue, "100/100", 24, { halign: "left", valign: "center" });
    }
}
