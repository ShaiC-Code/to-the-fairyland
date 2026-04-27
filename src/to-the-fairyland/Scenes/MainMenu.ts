import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Scene from "../../Wolfie2D/Scene/Scene";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import HoverButton from "../UI/CustomUIElements/HoverButton";
import UIImage from "../UI/CustomUIElements/UIImage";
import ShelterScene from "./Chapter1/ShelterScene";
import VillageScene from "./Chapter2/VillageScene";
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
import RoadScene from "./Chapter2/RoadScene";
import SleepingBag from "../GameSystems/ItemSystem/Items/SleepingBag";
import { Chapter2MainQuestStep } from "../GameSystems/StorySystem/StoryState";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import { TimeOfDay } from "../GameSystems/WorldSystem/WorldState";
import CliffScene from "./Chapter2/CliffScene";


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
        path: "/assets/images/main-screen-image.png"
    };

    protected readonly mainScreenMusic: AssetRef = {
        key: "main-screen-music",
        path: "/assets/sounds/main-screen-music.ogg"
    };

    protected readonly uiHover: AssetRef = {
        key: "ui-hover",
        path: "/assets/sounds/ui-hover.ogg"
    };

    protected readonly uiClick: AssetRef = {
        key: "ui-click",
        path: "/assets/sounds/ui-click.ogg"
    };

    public loadScene(){
        this.load.image(this.mainScreenImage.key, this.mainScreenImage.path);
        this.load.audio(this.mainScreenMusic.key, this.mainScreenMusic.path);

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

    public unloadScene(): void {
        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.mainScreenMusic.key });
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

        this.emitter.fireEvent(GameEventType.PLAY_MUSIC, { key: this.mainScreenMusic.key, loop: true, holdReference: true });

        this.receiver.subscribe("openLevelMenu");
        this.receiver.subscribe("openControlsMenu");
        this.receiver.subscribe("openHelpMenu");
        this.receiver.subscribe("openTestMenu");
        this.receiver.subscribe("backToMain");
        this.receiver.subscribe("level1");
        this.receiver.subscribe("level2");
        this.receiver.subscribe("level3");
        this.receiver.subscribe("level4");
        this.receiver.subscribe("level5");

    }

    public updateScene(deltaT: number){
        while(this.receiver.hasNextEvent()){
            this.handleEvent(this.receiver.getNextEvent());
        }

        this.mainMenu.update(deltaT);
        this.levelMenu.update(deltaT);
        this.controlsMenu.update(deltaT);
        this.helpMenu.update(deltaT);
        this.testMenu.update(deltaT);
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
                this.gameSessionManager.startNewChapter1Game();
                
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
            case "level2": {
                this.gameSessionManager.startNewChapter2Game();
            
                this.sceneManager.changeToScene(
                    VillageScene,
                    { spawnName: "RoadStart" },
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
            case "level3": {
                this.gameSessionManager.startNewChapter2Game();
            
                const chapter2 = this.gameSessionManager.getStoryState().chapter2;
                if (!chapter2) {
                    throw new Error("Chapter 2 story state was not initialized.");
                }
            
                chapter2.mainQuestStep = Chapter2MainQuestStep.READY_TO_LEAVE_VILLAGE;

                // =============== Fake inventory state =====================
                const inventory = this.gameSessionManager.getPlayerState().inventory;

                if (inventory.find(item => item instanceof SleepingBag) === null) {
                    inventory.add(new SleepingBag());
                }
                // ==========================================================
            
                this.sceneManager.changeToScene(
                    RoadScene,
                    { spawnName: "RoadStart" },
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
            case "level4": {
                this.gameSessionManager.startNewChapter2Game();
            
                const chapter2 = this.gameSessionManager.getStoryState().chapter2;
                if (!chapter2) {
                    throw new Error("Chapter 2 story state was not initialized.");
                }
            
                chapter2.mainQuestStep = Chapter2MainQuestStep.CHECK_VILLAGE;
            
                this.gameSessionManager.getWorldState().timeOfDay = TimeOfDay.NIGHT;
            
                this.sceneManager.changeToScene(
                    VillageScene,
                    { spawnName: "RoadEnd" },
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
            case "level5": {
                this.gameSessionManager.startNewChapter2Game();
                this.gameSessionManager.getWorldState().timeOfDay = TimeOfDay.NIGHT;
            
                const chapter2 = this.gameSessionManager.getStoryState().chapter2;
                if (!chapter2) {
                    throw new Error("Chapter 2 story state was not initialized.");
                }
            
                chapter2.mainQuestStep = Chapter2MainQuestStep.ESCAPE_LYCANS;
            
                this.sceneManager.changeToScene(
                    CliffScene,
                    { spawnName: "RoadStart" },
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