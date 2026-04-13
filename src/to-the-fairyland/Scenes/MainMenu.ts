import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Scene from "../../Wolfie2D/Scene/Scene";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import HoverButton from "../UI/CustomUIElements/HoverButton";
import UIImage from "../UI/CustomUIElements/UIImage";
import ForestScene  from "./Chapter1/ForestScene";
import ShelterScene from "./Chapter1/ShelterScene";
import TextBox from "../../Wolfie2D/Nodes/UIElements/TextBox";
import Input from "../../Wolfie2D/Input/Input";
import { CustomUIElementType } from "../UI/CustomUIElements/CustomUIElementTypes";
import LevelSelectionScreen from "../UI/MainMenuScreens/LevelSelectionScreen";
import ControlsScreen from "../UI/MainMenuScreens/ControlsScreen";
import HelpScreen from "../UI/MainMenuScreens/HelpScreen";
import MainScreen from "../UI/MainMenuScreens/MainScreen";
import TestScreen from "../UI/MainMenuScreens/TestScreen";
import GameSessionManager from "../GameSystems/GameSessionSystem/GameSessionManager";
import { PlayerInput } from "../AI/Player/PlayerController";
import { UIScreenActionBindings } from "../UI/UIScreen";


type AssetRef = Readonly<{
    key: string;
    path: string;
}>;

export default class MainMenu extends Scene {
    private readonly gameSessionManager = GameSessionManager.getInstance();

    private mainMenu!: MainScreen;
    private levelMenu!: LevelSelectionScreen;
    private controlsMenu!: ControlsScreen;
    private helpMenu!: HelpScreen;
    private testMenu!: TestScreen;

    protected readonly mainScreenImage: AssetRef = {
    key: "main-screen-image",
    path: "game_assets/images/main-screen-image.png"
    };

    protected readonly uiHover: AssetRef = {
        key: "ui-hover",
        path: "game_assets/sounds/ui-hover.ogg"
    };

    protected readonly uiClick: AssetRef = {
        key: "ui-click",
        path: "game_assets/sounds/ui-click.ogg"
    };

    public loadScene(){
        this.load.image(this.mainScreenImage.key, this.mainScreenImage.path);

        if (!this.resourceManager.getAudio(this.uiHover.key)) {
            this.load.audio(this.uiHover.key, this.uiHover.path);
        }

        if (!this.resourceManager.getAudio(this.uiClick.key)) {
            this.load.audio(this.uiClick.key, this.uiClick.path);
        }

        this.add.registerCustomUIElement(CustomUIElementType.HOVER_BUTTON, (options?: Record<string, any>) => {
            return new HoverButton(options!.position, options!.text);
        });

        this.add.registerCustomCanvasNode(CustomUIElementType.UI_IMAGE, (options?: Record<string, any>) => {
            return new UIImage(options!.imageKey);
        });
    }

    public startScene(){
        const uiActions: UIScreenActionBindings = {
            navigatePrevious: () => Input.isJustPressed(PlayerInput.MOVE_LEFT) || Input.isJustPressed(PlayerInput.MOVE_UP),
            navigateNext: () => Input.isJustPressed(PlayerInput.MOVE_RIGHT) || Input.isJustPressed(PlayerInput.MOVE_DOWN),
            confirm: () => Input.isJustPressed(PlayerInput.INTERACT)
        };

        this.mainMenu = new MainScreen(
            "mainMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            this.mainScreenImage.key,
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key, uiActions }
        );
        this.mainMenu.show();

        this.levelMenu = new LevelSelectionScreen(
            "levelMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key, uiActions }
        );

        this.controlsMenu = new ControlsScreen(
            "controlsMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key, uiActions }
        );

        this.helpMenu = new HelpScreen(
            "helpMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key, uiActions }
        );

        this.testMenu = new TestScreen(
            "testMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            { onEnterSFXKey: this.uiHover.key, onClickSFXKey: this.uiClick.key, uiActions }
        );

        this.receiver.subscribe("openLevelMenu");
        this.receiver.subscribe("openControlsMenu");
        this.receiver.subscribe("openHelpMenu");
        this.receiver.subscribe("openTestMenu");
        this.receiver.subscribe("backToMain");
        this.receiver.subscribe("level1");
    }

    public updateScene(){
        while(this.receiver.hasNextEvent()){
            this.handleEvent(this.receiver.getNextEvent());
        }

        this.mainMenu.update();
        this.levelMenu.update();
        this.controlsMenu.update();
        this.helpMenu.update();
        this.testMenu.update();
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
            case "openTestMenu": {
                this.showScreen("testMenu");
                break;
            }
            case "backToMain": {
                this.showScreen("mainMenu");
                break;
            }
            case "level1": {
                this.gameSessionManager.startNewGame();
                
                this.sceneManager.changeToScene(
                    ShelterScene,
                    {
                        spawnName: "SideOfBed",
                        facing: Vec2.DOWN
                    },
                    undefined,
                    {
                        showLoadingOverlay: true, 
                        useFadeTransition: true,
                        fadeOutMs: 500,
                        fadeInMs: 500
                    }
                );
                break;
            }
        }
    }

    private showScreen(screen: "mainMenu" | "levelMenu" | "controlsMenu" | "helpMenu" | "testMenu"): void {
        this.mainMenu.hide();
        this.levelMenu.hide();
        this.controlsMenu.hide();
        this.helpMenu.hide();
        this.testMenu.hide();

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
            case "testMenu":
                this.testMenu.show();
                break;
        }

        const demoTextBox = <TextBox>this.testMenu.getUIElement("demoTextBox");
        if (screen === "testMenu") {
            demoTextBox.startTypewriter(32);
        } else {
            demoTextBox.stopTypewriter();
        }
    }
}