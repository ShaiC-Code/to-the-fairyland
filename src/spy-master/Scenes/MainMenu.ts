import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Layer from "../../Wolfie2D/Scene/Layer";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import AstarDemoScene from "./AstarDemoScene";
import GuardDemoScene from "./GuardDemoScene";
import SMSceneMapMain from "./SMSceneMapMain";
import SMSceneMap1 from "./SMSceneMap1";
import SMSceneMap2 from "./SMSceneMap2";

export default class MainMenu extends Scene {
    // Layers, for multiple main menu screens
    private mainMenu: Layer;
    private about: Layer;
    private control: Layer;

    public loadScene(){}

    public startScene(){
        const center = this.viewport.getCenter();

        // The main menu
        this.mainMenu = this.addUILayer("mainMenu");

        const play1 = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {position: new Vec2(center.x, center.y - 200), text: "Play - Map 1"});
        play1.size.set(250, 50);
        play1.borderWidth = 2;
        play1.borderColor = Color.WHITE;
        play1.backgroundColor = Color.TRANSPARENT;
        play1.onClickEventId = "play1";

        const play2 = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {position: new Vec2(center.x, center.y - 100), text: "Play - Map 2"});
        play2.size.set(250, 50);
        play2.borderWidth = 2;
        play2.borderColor = Color.WHITE;
        play2.backgroundColor = Color.TRANSPARENT;
        play2.onClickEventId = "play2";

        const play3 = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {position: new Vec2(center.x, center.y), text: "Play - Map 3"});
        play3.size.set(250, 50);
        play3.borderWidth = 2;
        play3.borderColor = Color.WHITE;
        play3.backgroundColor = Color.TRANSPARENT;
        play3.onClickEventId = "play3";

        const astar = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {position: new Vec2(center.x, center.y + 100), text: "A* Test Scene"});
        astar.size.set(250, 50);
        astar.borderWidth = 2;
        astar.borderColor = Color.WHITE;
        astar.backgroundColor = Color.TRANSPARENT;
        astar.onClickEventId = "astar";

        const guard = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {position: new Vec2(center.x, center.y + 200), text: "Guard demo"});
        guard.size.set(250, 50);
        guard.borderWidth = 2;
        guard.borderColor = Color.WHITE;
        guard.backgroundColor = Color.TRANSPARENT;
        guard.onClickEventId = "guard";

        // Subscribe to the button events
        this.receiver.subscribe("play1");
        this.receiver.subscribe("play2");
        this.receiver.subscribe("play3");
        this.receiver.subscribe("astar");
        this.receiver.subscribe("guard");
    }

    public updateScene(){
        while(this.receiver.hasNextEvent()){
            this.handleEvent(this.receiver.getNextEvent());
        }
    }

    public handleEvent(event: GameEvent): void {
        switch(event.type) {
            case "play1": {
                this.sceneManager.changeToScene(SMSceneMapMain);
                break;
            }
            case "play2": {
                this.sceneManager.changeToScene(SMSceneMap1);
                break;
            }
            case "play3": {
                this.sceneManager.changeToScene(SMSceneMap2);
                break;
            }
            case "astar": {
                this.sceneManager.changeToScene(AstarDemoScene);
                break;
            }
            case "guard": {
                this.sceneManager.changeToScene(GuardDemoScene);
                break;
            }
        }
    }
}