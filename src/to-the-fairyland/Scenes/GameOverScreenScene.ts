import Scene from "../../Wolfie2D/Scene/Scene";
import Input from "../../Wolfie2D/Input/Input";
import UIImage from "../UI/CustomUIElements/UIImage";
import ClickableOverlay from "../UI/CustomUIElements/ClickableOverlay";
import { CustomUIElementType } from "../UI/CustomUIElements/CustomUIElementTypes";
import SplashScreen from "../UI/SplashScreenScreens/SplashScreen";
import MainMenu from "./MainMenu";
import { PlayerInput } from "../AI/Player/PlayerController";

type AssetRef = Readonly<{
    key: string;
    path: string;
}>;

export default class GameOverScreenScene extends Scene {

	  protected readonly GameOverScreenImage: AssetRef = {
        key: "game-over-screen-image",
        path: "/assets/images/game-over-screen-image.png"
	  };

	  protected readonly gameOverScreenProceedSFX: AssetRef = {
        key: "game-over-screen-proceed",
        path: "/assets/sounds/splash-screen-proceed.ogg"
	  };

    protected gameOverScreen!: SplashScreen;

	  public loadScene(): void {
        this.load.image(this.GameOverScreenImage.key, this.GameOverScreenImage.path);
        this.load.audio(this.gameOverScreenProceedSFX.key, this.gameOverScreenProceedSFX.path);

        this.add.registerCustomCanvasNode(CustomUIElementType.UI_IMAGE, (options?: Record<string, any>) => {
            return new UIImage(options!.imageKey);
        });

        this.add.registerCustomUIElement(CustomUIElementType.CLICKABLE_OVERLAY, (options?: Record<string, any>) => {
            return new ClickableOverlay(options!.position);
        });
    }

    public startScene(): void {
        this.gameOverScreen = new SplashScreen(
            "gameOverScreen",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            this.GameOverScreenImage.key,
            () => this.sceneManager.changeToScene(
                MainMenu, // Should be send to player to checkpoint, but is MainMenu for now
                undefined,
                undefined,
                {
                    useFadeTransition: true,
                    fadeOutMs: 500,
                    fadeInMs: 500
                }
            ),
            {
                onClickSFXKey: this.gameOverScreenProceedSFX.key,
                uiActions: {
                    navigatePrevious: () => false,
                    navigateNext: () => false,
                    confirm: () => Input.isJustPressed(PlayerInput.INTERACT)
                }
            }
        );
        this.gameOverScreen.show();
    }

    public updateScene(deltaT: number): void {
        this.gameOverScreen.update(deltaT);
    }
}
