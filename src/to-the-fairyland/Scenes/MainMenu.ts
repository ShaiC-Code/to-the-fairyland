import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Scene from "../../Wolfie2D/Scene/Scene";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import HoverButton from "../UI/CustomUIElements/HoverButton";
import ForestScene  from "./Chapter1/ForestScene";
import ShelterScene from "./Chapter1/ShelterScene";
import TextBox from "../../Wolfie2D/Nodes/UIElements/TextBox";
import { CustomUIElementType } from "../UI/CustomUIElements/CustomUIElementTypes";
import LevelSelectionScreen from "../UI/MainMenuScreens/LevelSelectionScreen";
import ControlsScreen from "../UI/MainMenuScreens/ControlsScreen";
import HelpScreen from "../UI/MainMenuScreens/HelpScreen";
import MainScreen from "../UI/MainMenuScreens/MainScreen";

type AssetRef = Readonly<{
    key: string;
    path: string;
}>;

export default class MainMenu extends Scene {
    private mainMenu!: MainScreen;
    private levelMenu!: LevelSelectionScreen;
    private controlsMenu!: ControlsScreen;
    private helpMenu!: HelpScreen;

    protected readonly uiHover: AssetRef = {
        key: "ui-hover",
        path: "game_assets/sounds/ui-hover.ogg"
    };

    protected readonly uiClick: AssetRef = {
        key: "ui-click",
        path: "game_assets/sounds/ui-click.ogg"
    };

    public loadScene(){
        if (!this.resourceManager.getAudio(this.uiHover.key)) {
            this.load.audio(this.uiHover.key, this.uiHover.path);
        }

        if (!this.resourceManager.getAudio(this.uiClick.key)) {
            this.load.audio(this.uiClick.key, this.uiClick.path);
        }

        this.add.registerCustomUIElement(CustomUIElementType.HOVER_BUTTON, (options?: Record<string, any>) => {
            return new HoverButton(options!.position, options!.text);
        });
    }

    public startScene(){
        this.mainMenu = new MainScreen(
            "mainMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key }
        );
        this.mainMenu.show();

        this.levelMenu = new LevelSelectionScreen(
            "levelMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key }
        );

        this.controlsMenu = new ControlsScreen(
            "controlsMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key }
        );

        this.helpMenu = new HelpScreen(
            "helpMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key }
        );

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
                this.sceneManager.changeToScene(
                    ShelterScene,
                    {
                        spawnName: "SideOfBed",
                        facing: Vec2.DOWN},
                    undefined,
                    {
                        showLoadingOverlay: true, 
                        useFadeTransition: true,
                        fadeOutMs: 1000,
                        fadeInMs: 1000
                    }
                );
                break;
            }
        }
    }

    private showScreen(screen: "mainMenu" | "levelMenu" | "controlsMenu" | "helpMenu"): void {
        this.mainMenu.hide();
        this.levelMenu.hide();
        this.controlsMenu.hide();
        this.helpMenu.hide();

        switch(screen) {
            case "mainMenu":
                this.mainMenu.show();
                break;
            case "levelMenu":
                this.levelMenu.show();
                break;
            case "controlsMenu":
                this.controlsMenu.show();
                break;
            case "helpMenu":
                this.helpMenu.show();
                break;
        }

        const demoTextBox = <TextBox>this.helpMenu.getUIElement("demoTextBox");
        if (screen === "helpMenu") {
            demoTextBox.startTypewriter(32);
        } else {
            demoTextBox.stopTypewriter();
        }
    }
}