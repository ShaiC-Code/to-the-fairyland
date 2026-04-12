import Scene from "../../Wolfie2D/Scene/Scene";
import UIImage from "../UI/CustomUIElements/UIImage";
import ClickableOverlay from "../UI/CustomUIElements/ClickableOverlay";
import { CustomUIElementType } from "../UI/CustomUIElements/CustomUIElementTypes";
import SplashScreen from "../UI/SplashScreenScreens/SplashScreen";
import MainMenu from "./MainMenu";

type AssetRef = Readonly<{
    key: string;
    path: string;
}>;

export default class SplashScreenScene extends Scene {

	  protected readonly splashImage: AssetRef = {
        key: "splash-screen",
        path: "game_assets/images/splash-screen.png"
	  };

	  protected readonly uiClick: AssetRef = {
        key: "ui-click",
        path: "game_assets/sounds/ui-click.ogg"
	  };

    protected splashScreen!: SplashScreen;

	  public loadScene(): void {
        this.load.image(this.splashImage.key, this.splashImage.path);

        if (!this.resourceManager.getAudio(this.uiClick.key)) {
            this.load.audio(this.uiClick.key, this.uiClick.path);
        }

        this.add.registerCustomCanvasNode(CustomUIElementType.UI_IMAGE, (options?: Record<string, any>) => {
            return new UIImage(options!.imageKey);
        });

        this.add.registerCustomUIElement(CustomUIElementType.CLICKABLE_OVERLAY, (options?: Record<string, any>) => {
            return new ClickableOverlay(options!.position);
        });
    }

    public startScene(): void {
        this.splashScreen = new SplashScreen(
            "splashScreen",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            this.splashImage.key,
            () => this.sceneManager.changeToScene(
                MainMenu,
                undefined,
                undefined,
                {
                    showLoadingOverlay: false,
                    useFadeTransition: true,
                    fadeOutMs: 500,
                    fadeInMs: 500
                }
            ),
            { onClickSFXKey: this.uiClick.key }
        );
        this.splashScreen.show();
    }
}
