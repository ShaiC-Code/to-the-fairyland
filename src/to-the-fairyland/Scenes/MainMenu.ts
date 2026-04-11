import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Line from "../../Wolfie2D/Nodes/Graphics/Line";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Layer from "../../Wolfie2D/Scene/Layer";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import HoverButton from "../UI/CustomUIElements/HoverButton";
import ForestScene  from "./Chapter1/ForestScene";
import ShelterScene from "./Chapter1/ShelterScene";
import TextBox from "../../Wolfie2D/Nodes/UIElements/TextBox";
import { CustomUIElementType } from "../UI/CustomUIElements/CustomUIElementTypes";

export default class MainMenu extends Scene {
    private mainMenu!: Layer;
    private levelMenu!: Layer;
    private controlsMenu!: Layer;
    private helpMenu!: Layer;

    public loadScene(){}

    public startScene(){
        const center = this.viewport.getCenter();
        const halfSize = this.viewport.getHalfSize();

        this.add.registerCustomUIElement(CustomUIElementType.HOVER_BUTTON, (options?: Record<string, any>) => {
            return new HoverButton(options!.position, options!.text);
        });

        this.mainMenu = this.addUILayer("mainMenu");
        this.levelMenu = this.addUILayer("levelMenu");
        this.controlsMenu = this.addUILayer("controlsMenu");
        this.helpMenu = this.addUILayer("helpMenu");

        this.levelMenu.setHidden(true);
        this.helpMenu.setHidden(true);
        this.controlsMenu.setHidden(true);

        this.createMainMenu("mainMenu", center, halfSize);
        this.createLevelMenu("levelMenu", center, halfSize);
        this.createControlsMenu("controlsMenu", center, halfSize);
        this.createHelpMenu("helpMenu", center, halfSize);

        this.receiver.subscribe("openLevelMenu");
        this.receiver.subscribe("openControlsMenu");
        this.receiver.subscribe("openHelpMenu");
        this.receiver.subscribe("backToMain");
        this.receiver.subscribe("level1");
    }

    public updateScene(){
        while(this.receiver.hasNextEvent()){
            this.handleEvent(this.receiver.getNextEvent());
        }
    }

    public handleEvent(event: GameEvent): void {
        switch(event.type) {
            case "openLevelMenu": {
                this.showScreen("levelMenu");
                break;
            }
            case "openControlsMenu": {
                this.showScreen("controlsMenu");
                break;
            }
            case "openHelpMenu": {
                this.showScreen("helpMenu");
                break;
            }
            case "backToMain": {
                this.showScreen("mainMenu");
                break;
            }
            case "level1": {
                this.sceneManager.changeToScene(ShelterScene, {
                    spawnName: "SideOfBed",
                    facing: Vec2.DOWN
                });
            }
            
        }
    }

    private createMainMenu(layerName: string, center: Vec2, halfSize: Vec2): void {
        const top = center.y - halfSize.y + 100;
        const left = center.x - halfSize.x + 100;
        const right = center.x + halfSize.x - 100;
        const listTop = top + 200;
        const listLeft = left + 100;
        const verticalOffset = 60;

        this.addLabel(layerName, listLeft + 100, top + 100, "To The FairyLand", 64, 420);
        
        const mainMenuButtons = [
            { name: "New Game", eventId: "level1" },
            { name: "Resume", eventId: "currentLevel" },
            { name: "Level", eventId: "openLevelMenu" },
            { name: "Controls", eventId: "openControlsMenu" },
            { name: "Help", eventId: "openHelpMenu" }
        ];

        mainMenuButtons.forEach((btnInfo, index) => {
            this.addButton(layerName, listLeft, listTop + verticalOffset * index, btnInfo.name, btnInfo.eventId);
        });
    }

    private createLevelMenu(layerName: string, center: Vec2, halfSize: Vec2): void {
        const top = center.y - halfSize.y + 100;
        const left = center.x - halfSize.x + 100;
        const right = center.x + halfSize.x - 100;
        const listTop = top + 120;
        const verticalOffset = 60;

        this.addLeftLabel(layerName, left, top, "Level Menu", 52, 420);

        const divider = <Line>this.add.graphic(GraphicType.LINE, layerName, {
            start: new Vec2(left, top + 40),
            end: new Vec2(right, top + 40)
        });
        divider.color = Color.WHITE;
        divider.thickness = 2;

        const levelButtons = [
            { name: "Level 1", eventId: "level1" },
            { name: "Level 2", eventId: "level2" },
            { name: "Level 3", eventId: "level3" },
            { name: "Level 4", eventId: "level4" },
            { name: "Level 5", eventId: "level5" },
            { name: "Level 6", eventId: "level6" },
            { name: "Back", eventId: "backToMain" }
        ];

        levelButtons.forEach((btnInfo, index) => {
            this.addHoverButton(layerName, center.x, listTop + verticalOffset * index, btnInfo.name, btnInfo.eventId);
        });
    }

    private createControlsMenu(layerName: string, center: Vec2, halfSize: Vec2): void {
        const top = center.y - halfSize.y + 100;
        const left = center.x - halfSize.x + 100;
        const right = center.x + halfSize.x - 100;
        const tableTop = top + 120;
        const tableLeft = left + 40;
        const actionCol = tableLeft;
        const keyCol = tableLeft + 300;
        const verticalOffset = 60;

        this.addLeftLabel(layerName, left, top, "CONTROLS", 52, 420);

        const divider = <Line>this.add.graphic(GraphicType.LINE, layerName, {
            start: new Vec2(left, top + 40),
            end: new Vec2(right, top + 40)
        });
        divider.color = Color.WHITE;
        divider.thickness = 2;

        this.addLeftLabel(layerName, actionCol, tableTop + verticalOffset  *0, "↑", 48, 80);
        this.addLeftLabel(layerName, keyCol, tableTop + verticalOffset * 0, "W, UP-ARROW", 32, 520);

        this.addLeftLabel(layerName, actionCol, tableTop + verticalOffset * 1, "←", 48, 80);
        this.addLeftLabel(layerName, keyCol, tableTop + verticalOffset * 1, "A, LEFT-ARROW", 32, 520);

        this.addLeftLabel(layerName, actionCol, tableTop + verticalOffset * 2, "↓", 48, 80);
        this.addLeftLabel(layerName, keyCol, tableTop + verticalOffset * 2, "S, DOWN-ARROW", 32, 520);

        this.addLeftLabel(layerName, actionCol, tableTop + verticalOffset * 3, "→", 48, 80);
        this.addLeftLabel(layerName, keyCol, tableTop + verticalOffset * 3, "D, RIGHT-ARROW", 32, 520);

        this.addLeftLabel(layerName, actionCol, tableTop + verticalOffset * 4, "Interact/Confirm", 32, 360);
        this.addLeftLabel(layerName, keyCol, tableTop + verticalOffset * 4, "J, Z", 32, 220);

        this.addLeftLabel(layerName, actionCol, tableTop + verticalOffset * 5, "Cancel", 32, 230);
        this.addLeftLabel(layerName, keyCol, tableTop + verticalOffset * 5, "K, X", 32, 220);

        this.addLeftLabel(layerName, actionCol, tableTop + verticalOffset * 6, "Inventory", 32, 260);
        this.addLeftLabel(layerName, keyCol, tableTop + verticalOffset * 6, "C", 32, 220);

        this.addLeftLabel(layerName, actionCol, tableTop + verticalOffset * 7, "Pause/Close", 32, 280);
        this.addLeftLabel(layerName, keyCol, tableTop + verticalOffset * 7, "ESC", 32, 220);

        this.addButton(layerName, center.x, top + 700, "Back", "backToMain");
    }

    private createHelpMenu(layerName: string, center: Vec2, halfSize: Vec2): void {
        const top = center.y - halfSize.y + 100;
        const left = center.x - halfSize.x + 100;
        const right = center.x + halfSize.x - 100;

        this.addLeftLabel(layerName, left, top, "HELP", 52, 420);

        const divider = <Line>this.add.graphic(GraphicType.LINE, layerName, {
            start: new Vec2(left, top + 40),
            end: new Vec2(right, top + 40)
        });
        divider.color = Color.WHITE;
        divider.thickness = 2;
        
        const helpButtons = [
            { name: "How to Play", eventId: "openControlsMenu", x: top + 100 },
            { name: "Controls", eventId: "openControlsMenu", x: top + 200 },
            { name: "Back", eventId: "backToMain", x: top + 300 }
        ];

        helpButtons.forEach((btnInfo) => {
            this.addButton(layerName, center.x, btnInfo.x, btnInfo.name, btnInfo.eventId);
        });

        const demoTextBox = <TextBox>this.add.uiElement(UIElementType.TEXT_BOX, layerName, {
            position: new Vec2(center.x, center.y + 300)
        });

        demoTextBox.size.set(720, 240);
        demoTextBox.fontSize = 24;
        demoTextBox.textColor = Color.WHITE;
        demoTextBox.backgroundColor = Color.BLACK;
        demoTextBox.padding.set(20, 20);
        demoTextBox.borderColor = Color.WHITE;
        demoTextBox.borderWidth = 8;
        demoTextBox.borderRadius = 0;
        demoTextBox.maxLines = 8;
        demoTextBox.setText("This is a very long sentence to test textbox word wrap behavior and see whether it wraps to multiple lines automatically when the text exceeds the available width.");
    }

    private showScreen(screen: "mainMenu" | "levelMenu" | "controlsMenu" | "helpMenu"): void {
        this.mainMenu.setHidden(screen !== "mainMenu");
        this.levelMenu.setHidden(screen !== "levelMenu");
        this.controlsMenu.setHidden(screen !== "controlsMenu");
        this.helpMenu.setHidden(screen !== "helpMenu");

        const demoTextBox = <TextBox>this.helpMenu.getItems().find(item => item instanceof TextBox);
        if (screen === "helpMenu") {
            demoTextBox.startTypewriter(32);
        } else {
            demoTextBox.stopTypewriter();
        }
    }

    private addButton(layerName: string, x: number, y: number, text: string, eventId: string): void {
        const button = this.add.uiElement(UIElementType.BUTTON, layerName, {
            position: new Vec2(x, y),
            text: text
        });
        button.size.set(250, 50);
        button.borderWidth = 2;
        button.borderColor = Color.WHITE;
        button.backgroundColor = Color.TRANSPARENT;
        button.onClickEventId = eventId;
    }

    private addHoverButton(layerName: string, x: number, y: number, text: string, eventId: string): void {
        const button = this.add.uiElement(CustomUIElementType.HOVER_BUTTON, layerName, {
            position: new Vec2(x, y),
            text: text
        });
        button.size.set(800, 50);
        button.borderWidth = 0;
        button.borderRadius = 0;
        button.onClickEventId = eventId;
    }

    private addLabel(layerName: string, x: number, y: number, text: string, fontSize: number, width: number): void {
        const label = <Label>this.add.uiElement(UIElementType.LABEL, layerName, {
            position: new Vec2(x, y),
            text: text
        });
        label.size.set(width, fontSize + 18);
        label.fontSize = fontSize;
        label.textColor = Color.WHITE;
        label.backgroundColor = Color.TRANSPARENT;
        label.borderColor = Color.TRANSPARENT;
    }

    private addLeftLabel(layerName: string, leftX: number, y: number, text: string, fontSize: number, width: number): void {
        const label = <Label>this.add.uiElement(UIElementType.LABEL, layerName, {
            position: new Vec2(leftX + width/2, y),
            text: text
        });
        label.size.set(width, fontSize + 18);
        label.setHAlign("left");
        label.fontSize = fontSize;
        label.textColor = Color.WHITE;
        label.backgroundColor = Color.TRANSPARENT;
        label.borderColor = Color.TRANSPARENT;
    }
}