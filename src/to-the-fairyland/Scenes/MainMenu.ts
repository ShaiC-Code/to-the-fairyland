import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Scene from "../../Wolfie2D/Scene/Scene";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import HoverButton from "../UI/CustomUIElements/HoverButton";
import UIImage from "../UI/CustomUIElements/UIImage";
import ForestScene from "./Chapter1/ForestScene";
import ShelterScene from "./Chapter1/ShelterScene";
import GreatTreeScene from "./Chapter3/GreatTreeScene";
import DeeperForestScene from "./Chapter3/DeeperForestScene";
import VillageScene from "./Chapter2/VillageScene";
import Road1Scene from "./Chapter2/Road1Scene";
import Road2Scene from "./Chapter2/Road2Scene";
import Road3Scene from "./Chapter2/Road3Scene";
import TextBox from "../../Wolfie2D/Nodes/UIElements/TextBox";
import Input from "../../Wolfie2D/Input/Input";
import { CustomUIElementType } from "../UI/CustomUIElements/CustomUIElementTypes";
import LevelSelectionScreen from "../UI/MainMenuScreens/LevelSelectionScreen";
import ControlsScreen from "../UI/MainMenuScreens/ControlsScreen";
import HelpScreen from "../UI/MainMenuScreens/HelpScreen";
import MainScreen from "../UI/MainMenuScreens/MainScreen";
import TestScreen from "../UI/MainMenuScreens/TestScreen";
import GameSessionManager from "../GameSystems/GameSessionSystem/GameSessionManager";
import { GameSessionResumePoint } from "../GameSystems/GameSessionSystem/GameSessionState";
import { LEVEL_TO_CHECKPOINT_STORY_KEY, LevelSelectionId } from "../GameSystems/GameSessionSystem/LevelCheckpointMapping";
import { PlayerInput } from "../AI/Player/PlayerController";
import { UIScreenActionBindings, UIScreenOptions } from "../UI/UIScreen";
import RoadScene from "./Chapter2/RoadScene";
import SleepingBag from "../GameSystems/ItemSystem/Items/SleepingBag";
import { Chapter2MainQuestStep, Chapter3MainQuestStep } from "../GameSystems/StorySystem/StoryState";
import { TimeOfDay } from "../GameSystems/WorldSystem/WorldState";
import CliffScene from "./Chapter2/CliffScene";
import EmeraldPondScene from "./Chapter7/EmeraldPondScene";
import CliffBottomScene from "./Chapter3/CliffBottomScene";
import TreeInnerScene from "./Chapter3/TreeInnerScene";
import Excalibur from "../GameSystems/ItemSystem/Items/Excalibur";
import FreshPrettyTooth from "../GameSystems/ItemSystem/Items/FreshPrettyTooth";
import AudioController from "../GameSystems/AudioController";
import DesertLandScene from "./Chapter4/DesertLandScene";
import DesertLandScene1 from "./Chapter4/DesertLandScene1";

type AssetRef = Readonly<{
    readonly key: string;
    readonly path: string;
}>;

type AssetManifest = Record<string, AssetRef>;

type AssetBundle = {
    tilemaps: AssetManifest;
    spritesheets: AssetManifest;
    sprites: AssetManifest;
    sounds: AssetManifest;
    images: AssetManifest;
    [category: string]: AssetManifest | undefined;
};

const levelLoadTransition = {
    showLoadingOverlay: true,
    useFadeTransition: true,
    fadeOutMs: 500,
    fadeInMs: 500
};

export default class MainMenu extends Scene {
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {},
        sounds: {
            uiHoverSFX: { key: "ui-hover", path: "/assets/sounds/ui-hover.ogg" },
            uiClickSFX: { key: "ui-click", path: "/assets/sounds/ui-click.ogg" },
            mainScreenMusic: { key: "main-screen-music", path: "/assets/sounds/main-screen-music.ogg" }
        },
        images: {
            mainScreenImage: { key: "main-screen-image", path: "/assets/images/main-screen-image.png" },
        }
    };

    protected assets: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {},
        sounds: {},
        images: {}
    };
    
    private readonly gameSessionManager = GameSessionManager.getInstance();

    private mainMenu!: MainScreen;
    private levelMenu!: LevelSelectionScreen;
    private controlsMenu!: ControlsScreen;
    private helpMenu!: HelpScreen;
    private testMenu!: TestScreen;

    private cheatsEnabled = false;

    public override initScene(): void {
        this.assets = MainMenu.assetBundle;
    }

    public loadScene(){
        this.loadAssets(this.assets);

        this.add.registerCustomUIElement(CustomUIElementType.HOVER_BUTTON, (options?: Record<string, any>) => {
            return new HoverButton(options!.position, options!.text);
        });

        this.add.registerCustomCanvasNode(CustomUIElementType.UI_IMAGE, (options?: Record<string, any>) => {
            return new UIImage(options!.imageKey);
        });
    }

    public unloadScene(): void {
        this.keepAssets(MainMenu.assetBundle);
        AudioController.getInstance().stopMusic();
    }

    protected mergeAssetBundles(parent: AssetBundle, child: AssetBundle): AssetBundle {
        return {
            tilemaps: { ...(parent.tilemaps ?? {}), ...(child.tilemaps ?? {}) },
            spritesheets: { ...(parent.spritesheets ?? {}), ...(child.spritesheets ?? {}) },
            sprites: { ...(parent.sprites ?? {}), ...(child.sprites ?? {}) },
            sounds: { ...(parent.sounds ?? {}), ...(child.sounds ?? {}) },
            images: { ...(parent.images ?? {}), ...(child.images ?? {}) }
        };
    }

    protected assetBundleToKeyArrays(bundle: AssetBundle): {
        tilemaps: ReadonlyArray<AssetRef>;
        spritesheets: ReadonlyArray<AssetRef>;
        sprites: ReadonlyArray<AssetRef>;
        sounds: ReadonlyArray<AssetRef>;
        images: ReadonlyArray<AssetRef>;
    } {
        const tilemaps = Object.values(bundle.tilemaps ?? {});
        const spritesheets = Object.values(bundle.spritesheets ?? {});
        const sprites = Object.values(bundle.sprites ?? {});
        const sounds = Object.values(bundle.sounds ?? {});
        const images = Object.values(bundle.images ?? {});
        return {tilemaps, spritesheets, sprites, sounds, images};
    }
    
    protected loadAssets(assets: AssetBundle): void {
        const { tilemaps, spritesheets, sprites, sounds, images } = this.assetBundleToKeyArrays(assets);

        tilemaps
            .filter(tilemap => !this.resourceManager.getTilemap(tilemap.key))
            .forEach(tilemap => this.load.tilemap(tilemap.key, tilemap.path));
        spritesheets
            .filter(spritesheet => !this.resourceManager.getSpritesheet(spritesheet.key))
            .forEach(spritesheet => this.load.spritesheet(spritesheet.key, spritesheet.path));
        sprites
            .filter(sprite => !this.resourceManager.getImage(sprite.key))
            .forEach(sprite => this.load.image(sprite.key, sprite.path));
        sounds
            .filter(sound => !this.resourceManager.getAudio(sound.key))
            .forEach(sound => this.load.audio(sound.key, sound.path));
        images
            .filter(image => !this.resourceManager.getImage(image.key))
            .forEach(image => this.load.image(image.key, image.path));
    }

    protected keepAssets(assets: AssetBundle): void {
        const { tilemaps, spritesheets, sprites, sounds, images } = this.assetBundleToKeyArrays(assets);

        tilemaps.forEach(tilemap => {this.load.keepTilemap(tilemap.key)});
        spritesheets.forEach(spritesheet => {this.load.keepSpritesheet(spritesheet.key)});
        sprites.forEach(sprite => {this.load.keepImage(sprite.key)});
        sounds.forEach(sound => {this.load.keepAudio(sound.key)});
        images.forEach(image => {this.load.keepImage(image.key)});
    }

    public startScene(): void {
        const uiActions: UIScreenActionBindings = {
            navigatePrevious: () => Input.isJustPressed(PlayerInput.MOVE_LEFT) || Input.isJustPressed(PlayerInput.MOVE_UP),
            navigateNext: () => Input.isJustPressed(PlayerInput.MOVE_RIGHT) || Input.isJustPressed(PlayerInput.MOVE_DOWN),
            confirm: () => Input.isJustPressed(PlayerInput.INTERACT)
        };

        const uiOptions: UIScreenOptions = {
            onEnterSFXKey: this.assets.sounds.uiHoverSFX.key,
            onClickSFXKey: this.assets.sounds.uiClickSFX.key,
            uiActions
        };

        AudioController.getInstance().playMusic(this.assets.sounds.mainScreenMusic.key, true, true, 3);

        this.mainMenu = new MainScreen(
            "mainMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            this.assets.images.mainScreenImage.key,
            uiOptions
        );

        this.levelMenu = new LevelSelectionScreen(
            "levelMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            uiOptions
        );

        this.controlsMenu = new ControlsScreen(
            "controlsMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            uiOptions
        );

        this.helpMenu = new HelpScreen(
            "helpMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            uiOptions
        );

        this.testMenu = new TestScreen(
            "testMenu",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            uiOptions
        );

        this.receiver.subscribe("openLevelMenu");
        this.receiver.subscribe("openControlsMenu");
        this.receiver.subscribe("openHelpMenu");
        this.receiver.subscribe("openTestMenu");
        this.receiver.subscribe("activateCheats");
        this.receiver.subscribe("backToMain");
        this.receiver.subscribe("currentLevel");
        this.receiver.subscribe("level1");
        this.receiver.subscribe("level2");
        this.receiver.subscribe("level3");
        this.receiver.subscribe("level4");
        this.receiver.subscribe("level5");
        this.receiver.subscribe("level6");
        this.receiver.subscribe("level7");
        this.receiver.subscribe("level8");
        this.receiver.subscribe("level9");
        this.receiver.subscribe("level10");

        this.mainMenu.setResumeEnabled(this.gameSessionManager.hasSavedSession());
        this.mainMenu.show();
    }

    public updateScene(deltaT: number): void {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }

        this.mainMenu.setResumeEnabled(this.gameSessionManager.hasSavedSession());

        this.mainMenu.update(deltaT);
        this.levelMenu.update(deltaT);
        this.controlsMenu.update(deltaT);
        this.helpMenu.update(deltaT);
        this.testMenu.update(deltaT);
    }

    public handleEvent(event: GameEvent): void {
        switch (event.type) {
        case "openLevelMenu":
            this.showScreen("levelMenu");
            break;

        case "openControlsMenu":
            this.showScreen("controlsMenu");
            break;

        case "openHelpMenu":
            this.showScreen("helpMenu");
            break;

        case "openTestMenu":
            this.showScreen("testMenu");
            break;

        case "activateCheats":
            this.cheatsEnabled = !this.cheatsEnabled;
            break;

        case "backToMain":
            this.showScreen("mainMenu");
            break;

        case "currentLevel":
            this.resumeCurrentGame();
            break;

        case "level1":
            this.enterLevel(
                "level1",
                ShelterScene,
                () => this.gameSessionManager.startNewChapter1Game(),
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "SideOfBed",
                    facing: Vec2.DOWN
                }
            );
            break;

        case "level2":
            this.enterLevel(
                "level2",
                VillageScene,
                () => this.gameSessionManager.startNewChapter2Game(),
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "RoadStart"
                }
            );
            break;

        case "level3":
            this.enterLevel(
                "level3",
                RoadScene,
                () => {
                    this.gameSessionManager.startNewChapter2Game();

                    const chapter2 = this.gameSessionManager.getStoryState().chapter2;
                    if (!chapter2) {
                        throw new Error("Chapter 2 story state was not initialized.");
                    }

                    const inventory = this.gameSessionManager.getPlayerState().inventory;
                    if (inventory.find(item => item instanceof SleepingBag) === null) {
                        inventory.add(new SleepingBag());
                    }

                    chapter2.mainQuestStep = Chapter2MainQuestStep.LEAVE_VILLAGE;
                    this.gameSessionManager.setResumePoint("VillageScene", "RoadStart");
                },
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "RoadStart"
                }
            );
            break;

        case "level4":
            this.enterLevel(
                "level4",
                VillageScene,
                () => {
                    this.gameSessionManager.startNewChapter2Game();

                    const chapter2 = this.gameSessionManager.getStoryState().chapter2;
                    if (!chapter2) {
                        throw new Error("Chapter 2 story state was not initialized.");
                    }

                    chapter2.mainQuestStep = Chapter2MainQuestStep.RETURNED_TO_VILLAGE;
                    this.gameSessionManager.getWorldState().timeOfDay = TimeOfDay.NIGHT;
                    this.gameSessionManager.setResumePoint("VillageScene", "RoadEnd");
                },
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "RoadEnd"
                }
            );
            break;

        case "level5":
            this.enterLevel(
                "level5",
                CliffScene,
                () => {
                    this.gameSessionManager.startNewChapter2Game();
                    this.gameSessionManager.getWorldState().timeOfDay = TimeOfDay.NIGHT;

                    const chapter2 = this.gameSessionManager.getStoryState().chapter2;
                    if (!chapter2) {
                        throw new Error("Chapter 2 story state was not initialized.");
                    }

                    chapter2.mainQuestStep = Chapter2MainQuestStep.CLIFF_JUMP;
                    this.gameSessionManager.setResumePoint("CliffScene", "RoadStart");
                },
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "RoadStart"
                }
            );
            break;

        case "level6":
            this.enterLevel(
                "level6",
                CliffBottomScene,
                () => {
                    this.gameSessionManager.startNewChapter3Game();

                    const chapter3 = this.gameSessionManager.getStoryState().chapter3;
                    if (!chapter3) {
                        throw new Error("Chapter 3 story state was not initialized.");
                    }

                    const inventory = this.gameSessionManager.getPlayerState().inventory;
                    if (inventory.find(item => item instanceof FreshPrettyTooth) === null) {
                        inventory.add(new FreshPrettyTooth());
                    }

                    chapter3.mainQuestStep = Chapter3MainQuestStep.FAINTED;
                    this.gameSessionManager.setResumePoint("CliffBottomScene", "RoadStart");
                },
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "RoadStart"
                }
            );
            break;

        case "level7":
            this.enterLevel(
                "level7",
                TreeInnerScene,
                () => {
                    this.gameSessionManager.startNewChapter3Game();

                    const chapter3 = this.gameSessionManager.getStoryState().chapter3;
                    if (!chapter3) {
                        throw new Error("Chapter 3 story state was not initialized.");
                    }

                    chapter3.mainQuestStep = Chapter3MainQuestStep.NEED_EXCALIBUR;
                    this.gameSessionManager.setResumePoint("GreatTreeScene", "TreeInner");
                },
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "TreeInner"
                }
            );
            break;

        case "level8":
            this.enterLevel(
                "level8",
                GreatTreeScene,
                () => {
                    this.gameSessionManager.startNewChapter3Game();

                    const chapter3 = this.gameSessionManager.getStoryState().chapter3;
                    if (!chapter3) {
                        throw new Error("Chapter 3 story state was not initialized.");
                    }

                    const inventory = this.gameSessionManager.getPlayerState().inventory;
                    if (inventory.find(item => item instanceof Excalibur) === null) {
                        inventory.add(new Excalibur());
                    }

                    chapter3.mainQuestStep = Chapter3MainQuestStep.VINE_EXIT_OPEN;
                    this.gameSessionManager.setResumePoint("GreatTreeScene", "TreeOuter");
                },
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "TreeOuter"
                }
            );
            break;
            
        case "level9":
            this.enterLevel(
                "level9",
                DesertLandScene,
                () => this.gameSessionManager.startNewChapter4Game(),
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "RoadStart"
                }
            );
            break;

        case "level10":
            this.enterLevel(
                "level10",
                EmeraldPondScene,
                () => this.gameSessionManager.startNewGame(),
                {
                    cheatsEnabled: this.cheatsEnabled,
                    spawnName: "Fate"
                }
            );
            break;
        }
    }

    private resumeCurrentGame(): void {
        this.gameSessionManager.restoreSessionFromCookie();
        const resumePoint = this.gameSessionManager.getResumePoint();

        if (!resumePoint) {
            this.gameSessionManager.startNewGame();
            changeToNewGameStartScene(this.sceneManager);
            return;
        }

        if (!changeToResumePointScene(this.sceneManager, resumePoint)) {
            this.gameSessionManager.startNewGame();
            changeToNewGameStartScene(this.sceneManager);
        }
    }

    private enterLevel(
        levelId: LevelSelectionId,
        scene: new (...args: any[]) => Scene,
        initializeSession: () => void,
        sceneInit: Record<string, any>
    ): void {
        const checkpointKey = LEVEL_TO_CHECKPOINT_STORY_KEY[levelId];

        if (this.gameSessionManager.loadCheckpoint(checkpointKey)) {
            this.gameSessionManager.setActiveCheckpointKey(checkpointKey);
            const resumePoint = this.gameSessionManager.getResumePoint();

            this.sceneManager.changeToScene(
                scene,
                {
                    cheatsEnabled: resumePoint?.cheatsEnabled ?? sceneInit.cheatsEnabled ?? false,
                    spawnName: resumePoint?.spawnName ?? sceneInit.spawnName,
                    fromResume: true
                },
                undefined,
                levelLoadTransition
            );

            return;
        }

        initializeSession();
        this.gameSessionManager.setActiveCheckpointKey(checkpointKey);
        this.gameSessionManager.saveCheckpoint(checkpointKey);

        this.sceneManager.changeToScene(
            scene,
            sceneInit,
            undefined,
            levelLoadTransition
        );
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

export function changeToNewGameStartScene(sceneManager: SceneManager): void {
    sceneManager.changeToScene(
        ShelterScene,
        {
            cheatsEnabled: false,
            spawnName: "SideOfBed",
            facing: Vec2.DOWN
        },
        undefined,
        levelLoadTransition
    );
}

export function changeToResumePointScene(sceneManager: SceneManager, resumePoint: GameSessionResumePoint): boolean {
    const initData = {
        cheatsEnabled: resumePoint.cheatsEnabled ?? false,
        spawnName: resumePoint.spawnName,
        fromResume: true
    };

    switch (resumePoint.sceneId) {
        case "ShelterScene":
            sceneManager.changeToScene(ShelterScene, { ...initData, facing: Vec2.DOWN }, undefined, levelLoadTransition);
            return true;
        case "ForestScene":
            sceneManager.changeToScene(ForestScene, initData, undefined, levelLoadTransition);
            return true;
        case "VillageScene":
            sceneManager.changeToScene(VillageScene, initData, undefined, levelLoadTransition);
            return true;
        case "RoadScene":
            sceneManager.changeToScene(RoadScene, initData, undefined, levelLoadTransition);
            return true;
        case "Road1Scene":
            sceneManager.changeToScene(Road1Scene, initData, undefined, levelLoadTransition);
            return true;
        case "Road2Scene":
            sceneManager.changeToScene(Road2Scene, initData, undefined, levelLoadTransition);
            return true;
        case "Road3Scene":
            sceneManager.changeToScene(Road3Scene, initData, undefined, levelLoadTransition);
            return true;
        case "CliffScene":
            sceneManager.changeToScene(CliffScene, initData, undefined, levelLoadTransition);
            return true;
        case "CliffBottomScene":
            sceneManager.changeToScene(CliffBottomScene, initData, undefined, levelLoadTransition);
            return true;
        case "DeeperForestScene":
            sceneManager.changeToScene(DeeperForestScene, initData, undefined, levelLoadTransition);
            return true;
        case "GreatTreeScene":
            sceneManager.changeToScene(GreatTreeScene, initData, undefined, levelLoadTransition);
            return true;
        case "TreeInnerScene":
            sceneManager.changeToScene(TreeInnerScene, initData, undefined, levelLoadTransition);
            return true;
        case "EmeraldPondScene":
            sceneManager.changeToScene(EmeraldPondScene, initData, undefined, levelLoadTransition);
            return true;
        default:
            return false;
    }
}