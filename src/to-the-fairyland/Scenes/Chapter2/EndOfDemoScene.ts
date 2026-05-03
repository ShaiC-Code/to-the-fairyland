import Scene from "../../../Wolfie2D/Scene/Scene";
import Timer from "../../../Wolfie2D/Timing/Timer";
import MainMenu from "../MainMenu";
import EndOfDemoScreen from "../../UI/EndOfDemoScreenScreens/EndOfDemoScreen";
import ClickableOverlay from "../../UI/CustomUIElements/ClickableOverlay";
import { CustomUIElementType } from "../../UI/CustomUIElements/CustomUIElementTypes";
import AudioController from "../../GameSystems/AudioController";

export default class EndOfDemoScene extends Scene {
    protected audioController!: AudioController;
    
    private transitioned = false;
    private endOfDemoScreen!: EndOfDemoScreen;
    private previewTimer!: Timer;

    private readonly previewDurationMs = 5000;
    private readonly fadeOutMs = 2000;
    private readonly fadeInMs = 2000;

    public loadScene(): void {
        this.add.registerCustomUIElement(CustomUIElementType.CLICKABLE_OVERLAY, (options?: Record<string, any>) => {
            return new ClickableOverlay(options!.position);
        });
    }

    public startScene(): void {
        this.audioController = new AudioController();

        this.endOfDemoScreen = new EndOfDemoScreen(
            "endOfDemoScreen",
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            this.audioController,
            () => this.proceedToMainMenu()
        );
        this.endOfDemoScreen.show();

        this.previewTimer = new Timer(this.previewDurationMs, () => this.proceedToMainMenu());
        this.previewTimer.start();
    }

    public updateScene(deltaT: number): void {
        if (this.transitioned) {
            return;
        }

        this.endOfDemoScreen.update(deltaT);
    }

    private proceedToMainMenu(): void {
        if (this.transitioned) {
            return;
        }

        this.transitioned = true;
        this.sceneManager.changeToScene(
            MainMenu,
            undefined,
            undefined,
            {
                useFadeTransition: true,
                fadeOutMs: this.fadeOutMs,
                fadeInMs: this.fadeInMs
            }
        );
    }
}