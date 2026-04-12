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

	  protected readonly splashProceed: AssetRef = {
        key: "splash-screen-proceed",
        path: "game_assets/sounds/splash-screen-proceed.ogg"
	  };

    protected splashScreen!: SplashScreen;

	  public loadScene(): void {
        this.load.image(this.splashImage.key, this.splashImage.path);
        this.load.audio(this.splashProceed.key, this.splashProceed.path);

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
                    fadeOutMs: 1000,
                    fadeInMs: 1000
                }
            ),
            { onClickSFXKey: this.splashProceed.key }
        );
        this.splashScreen.show();
    }
}
