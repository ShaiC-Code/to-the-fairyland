import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Line from "../../Wolfie2D/Nodes/Graphics/Line";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Layer from "../../Wolfie2D/Scene/Layer";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import AstarDemoScene from "./AstarDemoScene";
import GuardDemoScene from "./GuardDemoScene";
import SMSceneMapMain from "./SMSceneMapMain";
import SMSceneMap1 from "./SMSceneMap1";
import SMSceneMap2 from "./SMSceneMap2";
import Chapter1Scene from "./Chapter1Scene";

export default class MainMenu extends Scene {
    private mainMenu!: Layer;
    private levelMenu!: Layer;
    private controlsMenu!: Layer;
    private helpMenu!: Layer;

    public loadScene(){}

    public startScene(){
        const center = this.viewport.getCenter();
        const halfSize = this.viewport.getHalfSize();

        this.mainMenu = this.addUILayer("mainMenu");
        this.levelMenu = this.addUILayer("levelMenu");
        this.controlsMenu = this.addUILayer("controlsMenu");
        this.helpMenu = this.addUILayer("helpMenu");

        this.levelMenu.setHidden(true);
        this.helpMenu.setHidden(true);
        this.controlsMenu.setHidden(true);

        this.createMainMenu(center, halfSize);
        this.createLevelMenu(center, halfSize);
        this.createControlsMenu(center, halfSize);
        this.createHelpMenu(center, halfSize);

        this.receiver.subscribe("openLevelMenu");
        this.receiver.subscribe("openControlsMenu");
        this.receiver.subscribe("openHelpMenu");
        this.receiver.subscribe("backToMain");
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
        }
    }

    private createMainMenu(center: Vec2, halfSize: Vec2): void {
        const top = center.y - halfSize.y + 100;
        const left = center.x - halfSize.x + 100;
        const right = center.x + halfSize.x - 100;
        const listTop = top + 200;
        const listLeft = left + 100;
        const verticalOffset = 60;


        this.addLabel("mainMenu", listLeft + 100, top + 100, "To The FairyLand", 64, 420);
        this.addButton("mainMenu", listLeft, listTop + verticalOffset * 0, "New Game", "level1");
        this.addButton("mainMenu", listLeft, listTop + verticalOffset * 1, "Resume", "currentLevel");
        this.addButton("mainMenu", listLeft, listTop + verticalOffset * 2, "Level", "openLevelMenu");
        this.addButton("mainMenu", listLeft, listTop + verticalOffset * 3, "Controls", "openControlsMenu");
        this.addButton("mainMenu", listLeft, listTop + verticalOffset * 4, "Help", "openHelpMenu");
    }

    private createLevelMenu(center: Vec2, halfSize: Vec2): void {
        const top = center.y - halfSize.y + 100;
        const left = center.x - halfSize.x + 100;
        const right = center.x + halfSize.x - 100;
        const listTop = top + 120;
        const verticalOffset = 60;

        this.addLeftLabel("levelMenu", left, top, "Level Menu", 52, 420);

        const divider = <Line>this.add.graphic(GraphicType.LINE, "levelMenu", {
            start: new Vec2(left, top + 40),
            end: new Vec2(right, top + 40)
        });
        divider.color = Color.WHITE;
        divider.thickness = 2;

        this.addButton("levelMenu", center.x, listTop + verticalOffset * 0, "Level 1", "level1");
        this.addButton("levelMenu", center.x, listTop + verticalOffset * 1, "Level 2", "level2");
        this.addButton("levelMenu", center.x, listTop + verticalOffset * 2, "Level 3", "level3");
        this.addButton("levelMenu", center.x, listTop + verticalOffset * 3, "Level 4", "level4");
        this.addButton("levelMenu", center.x, listTop + verticalOffset * 4, "Level 5", "level5");
        this.addButton("levelMenu", center.x, listTop + verticalOffset * 5, "Level 6", "level6");
        this.addButton("levelMenu", center.x, listTop + verticalOffset * 6, "Back", "backToMain");
    }

    private createControlsMenu(center: Vec2, halfSize: Vec2): void {
        const top = center.y - halfSize.y + 100;
        const left = center.x - halfSize.x + 100;
        const right = center.x + halfSize.x - 100;
        const tableTop = top + 120;
        const tableLeft = left + 40;
        const actionCol = tableLeft;
        const keyCol = tableLeft + 300;
        const verticalOffset = 60;

        this.addLeftLabel("controlsMenu", left, top, "CONTROLS", 52, 420);

        const divider = <Line>this.add.graphic(GraphicType.LINE, "controlsMenu", {
            start: new Vec2(left, top + 40),
            end: new Vec2(right, top + 40)
        });
        divider.color = Color.WHITE;
        divider.thickness = 2;

        this.addLeftLabel("controlsMenu", actionCol, tableTop + verticalOffset  *0, "↑", 48, 80);
        this.addLeftLabel("controlsMenu", keyCol, tableTop + verticalOffset * 0, "W, UP-ARROW", 32, 520);

        this.addLeftLabel("controlsMenu", actionCol, tableTop + verticalOffset * 1, "←", 48, 80);
        this.addLeftLabel("controlsMenu", keyCol, tableTop + verticalOffset * 1, "A, LEFT-ARROW", 32, 520);

        this.addLeftLabel("controlsMenu", actionCol, tableTop + verticalOffset * 2, "↓", 48, 80);
        this.addLeftLabel("controlsMenu", keyCol, tableTop + verticalOffset * 2, "S, DOWN-ARROW", 32, 520);

        this.addLeftLabel("controlsMenu", actionCol, tableTop + verticalOffset * 3, "→", 48, 80);
        this.addLeftLabel("controlsMenu", keyCol, tableTop + verticalOffset * 3, "D, RIGHT-ARROW", 32, 520);

        this.addLeftLabel("controlsMenu", actionCol, tableTop + verticalOffset * 4, "Interact/Confirm", 32, 360);
        this.addLeftLabel("controlsMenu", keyCol, tableTop + verticalOffset * 4, "J, Z", 32, 220);

        this.addLeftLabel("controlsMenu", actionCol, tableTop + verticalOffset * 5, "Cancel", 32, 230);
        this.addLeftLabel("controlsMenu", keyCol, tableTop + verticalOffset * 5, "K, X", 32, 220);

        this.addLeftLabel("controlsMenu", actionCol, tableTop + verticalOffset * 6, "Inventory", 32, 260);
        this.addLeftLabel("controlsMenu", keyCol, tableTop + verticalOffset * 6, "C", 32, 220);

        this.addLeftLabel("controlsMenu", actionCol, tableTop + verticalOffset * 7, "Pause/Close", 32, 280);
        this.addLeftLabel("controlsMenu", keyCol, tableTop + verticalOffset * 7, "ESC", 32, 220);

        this.addButton("controlsMenu", center.x, top + 700, "Back", "backToMain");
    }

    private createHelpMenu(center: Vec2, halfSize: Vec2): void {
        const top = center.y - halfSize.y + 100;
        const left = center.x - halfSize.x + 100;
        const right = center.x + halfSize.x - 100;
        const tableTop = top + 120;
        const tableLeft = left + 40;
        const leftCol = tableLeft;
        const rightCol = tableLeft + 300;
        const verticalOffset = 60;

        this.addLeftLabel("helpMenu", left, top, "HELP", 52, 420);

        const divider = <Line>this.add.graphic(GraphicType.LINE, "helpMenu", {
            start: new Vec2(left, top + 40),
            end: new Vec2(right, top + 40)
        });
        divider.color = Color.WHITE;
        divider.thickness = 2;
        
        this.addButton("helpMenu", center.x, top + 100, "How to Play", "openControlsMenu");
        this.addButton("helpMenu", center.x, top + 200, "Controls", "openControlsMenu");
        this.addButton("helpMenu", center.x, top + 300, "Back", "backToMain");
    }

    private showScreen(screen: "mainMenu" | "levelMenu" | "controlsMenu" | "helpMenu"): void {
        this.mainMenu.setHidden(screen !== "mainMenu");
        this.levelMenu.setHidden(screen !== "levelMenu");
        this.controlsMenu.setHidden(screen !== "controlsMenu");
        this.helpMenu.setHidden(screen !== "helpMenu");
    }

    private addButton(layerName: string, x: number, y: number, text: string, eventId: string): void {
        const button = this.add.uiElement(UIElementType.BUTTON, layerName, {position: new Vec2(x, y), text: text});
        button.size.set(250, 50);
        button.borderWidth = 2;
        button.borderColor = Color.WHITE;
        button.backgroundColor = Color.TRANSPARENT;
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