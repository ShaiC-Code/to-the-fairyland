import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Color from "../../Wolfie2D/Utils/Color";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import UIScreen, { UIScreenOptions } from "./UIScreen";
import NullFunc from "../../Wolfie2D/DataTypes/Functions/NullFunc";
import Inventory from "../GameSystems/ItemSystem/Inventory";
import InventoryItem from "../GameSystems/ItemSystem/InventoryItem";
import { PlayerState } from "../GameSystems/PlayerSystem/PlayerState";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";

export default class InventoryScreen extends UIScreen {
    private readonly playerState: PlayerState;
    private readonly onItemSelected: ((item: InventoryItem) => void) | (() => void);
    private readonly maxHealthBarWidth = 300;
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
        playerState: PlayerState,
        onItemSelected?: (item: InventoryItem) => void,
        options?: UIScreenOptions
    ) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);
        this.playerState = playerState;
        this.onItemSelected = onItemSelected ?? NullFunc;
        this.initializeUI();
        this.refreshItems();
    }

    public override show(): void {
        this.refreshItems();
        this.refreshPlayerInfo();
        super.show();
    }

    private refreshItems(): void {
        const items = Array.from(this.playerState.inventory.items());

        for (let i = 0; i < this.itemButtonKeys.length; i++) {
            const button = this.getUIElement(this.itemButtonKeys[i]) as Button;
            const item = items[i];

            if (item) {
                button.text = item.displayName();
                button.onClick = () => {
                    this.playSFX(this.onClickSFXKey);
                    this.onItemSelected(item);
                };
                button.visible = true;
            } else {
                button.text = "";
                button.onClick = () => {
                    this.playSFX(this.onClickSFXKey);
                    NullFunc();
                };
                button.visible = false;
            }
        }

        this.syncNavigationSelection();
    }

    protected override initializeUI(): void {
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

        const itemButtonPositions = [
            menuButtonPos.item1,
            menuButtonPos.item2,
            menuButtonPos.item3,
            menuButtonPos.item4,
            menuButtonPos.item5,
            menuButtonPos.item6
        ];

        this.addRect("bg", screenCenter.clone(), viewportHalfSize.clone().scale(2), new Color(0, 0, 0, 0.7));
        this.initializePlayerInfoComponent();
        this.addLabel("inventoryLabel", new Vec2(screenCenter.x, screenTop + 225), new Vec2(viewportSize.x - 200, 50), "INVENTORY", 48, { halign: "left", valign: "center" });
        this.addLine("divider", new Vec2(screenLeft, screenTop + 275), new Vec2(screenRight, screenTop + 275), 2);

        this.itemButtonKeys.forEach((buttonKey, index) => {
            this.addHoverButton(buttonKey, itemButtonPositions[index], menuButtonSize, "", { onClick: NullFunc });
        });

        this.setNavigationButtons(this.itemButtonKeys);

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
            health: new Vec2(this.maxHealthBarWidth, 10),
            healthValue: new Vec2(100, 10)
        };

        const playerInfoPos = {
            icon: new Vec2(screenLeft + 75, screenTop + 75),
            name: new Vec2(screenLeft + 300, screenTop + 50),
            health: new Vec2(screenLeft + 350, screenTop + 115),
            healthValue: new Vec2(screenLeft + 575, screenTop + 115)
        };

        this.addRect("playerIcon", playerInfoPos.icon, playerInfoSize.icon, new Color(0, 0, 150, 1));
        this.addLabel("playerName", playerInfoPos.name, playerInfoSize.name, this.playerState.name, 48, { halign: "left", valign: "center" });
        this.addRect("playerHealth", playerInfoPos.health, playerInfoSize.health, new Color(150, 0, 0, 1));
        this.addLabel("playerHealthValue", playerInfoPos.healthValue, playerInfoSize.healthValue, "", 24, { halign: "left", valign: "center" });
        this.refreshPlayerInfo();
    }

    private refreshPlayerInfo(): void {
        const nameLabel = this.getUIElement("playerName") as Label | undefined;
        const healthBar = this.getUIElement("playerHealth") as Label | undefined;
        const healthValueLabel = this.getUIElement("playerHealthValue") as Label | undefined;
        const maxHealth = Math.max(1, this.playerState.maxHealth);
        const health = Math.max(0, Math.min(this.playerState.health, maxHealth));
        const healthRatio = health / maxHealth;

        if (nameLabel) {
            nameLabel.text = this.playerState.name;
        }

        if (healthBar) {
            healthBar.size.x = this.maxHealthBarWidth * healthRatio;
        }

        if (healthValueLabel) {
            healthValueLabel.text = `${health}/${maxHealth}`;
        }
    }
}
