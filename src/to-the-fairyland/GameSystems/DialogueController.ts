import Updateable from "../../Wolfie2D/DataTypes/Interfaces/Updateable";
import Scene from "../../Wolfie2D/Scene/Scene";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import Color from "../../Wolfie2D/Utils/Color";
import PlayerActor from "../Actors/PlayerActor";
import PlayerAI from "../AI/Player/PlayerAI";
import { PlayerControlMode, PlayerInput } from "../AI/Player/PlayerController";
import TintEffectOverlay from "../Overlays/TintEffectOverlay";
import { AssetBundle } from "../Scenes/MappedAdventureScene";
import CutsceneScreen from "../UI/CutsceneScreen";
import DialogueScreen, { DialogueLayoutMode } from "../UI/DialogueScreen";
import { UIScreenOptions } from "../UI/UIScreen";
import AudioController from "./AudioController";
import { DialogueChoiceOption, DialogueInteraction } from "./InteractionSystem/InteractionDatabase";

export type DialogueStartOptions = {
    layoutMode?: DialogueLayoutMode;
    onLineStart?: (lineIndex: number, line: string) => void;
};

export default class DialogueController implements Updateable {
    private assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {},
        sounds: {},
        images: {}
    };
    
    protected scene: Scene;
    protected viewport: Viewport;
    
    private player: PlayerActor;
    private handleDialogueCompleteAction: (option: DialogueInteraction) => void;
    private handleDialogueChoiceAction: (option: DialogueChoiceOption) => void;
    private confirm: () => boolean;

    private dialogueScreen: DialogueScreen;
    private cutsceneScreen: CutsceneScreen;
    private textDisplay: DialogueScreen | CutsceneScreen;
    private cutsceneBackgroundTintOverlay: TintEffectOverlay;
    private cutsceneMode: boolean = false;
    
    private activeDialogue: DialogueInteraction | null = null;
    private activeSpeakerName: string | undefined;
    private currentDialogueLine: number = 0;
    private dialogueChoiceActive: boolean = false;
    private dialogueChoiceResolved: boolean = false;
    private ignoreNextConfirm: boolean = false;
    private activeStartOptions: DialogueStartOptions = {};
    private controlModeBeforeDialogue: PlayerControlMode | null = null;
    
    private readonly dialogueLayerName = "dialogueOverlay";
    private readonly cutsceneLayerName = "cutsceneOverlay";
    private readonly cutsceneBackgroundTintLayerName = "cutsceneBackgroundTintLayer";

    public isActive: boolean = false;

    constructor(
      scene: Scene,
      viewport: Viewport,
      player: PlayerActor,
      handleDialogueCompleteAction: (option: DialogueInteraction) => void,
      handleDialogueChoiceAction: (option: DialogueChoiceOption) => void,
      options?: UIScreenOptions
    ) {
        this.scene = scene;
        this.viewport = viewport;
        this.player = player;
        this.handleDialogueCompleteAction = handleDialogueCompleteAction;
        this.handleDialogueChoiceAction = handleDialogueChoiceAction;

        this.confirm = options?.uiActions?.confirm ?? (() => {
            const ai = this.player.ai as PlayerAI;
            return ai.controller.isJustPressed(PlayerInput.INTERACT);
        });

        this.dialogueScreen = new DialogueScreen(
            this.dialogueLayerName,
            this.scene,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            undefined,
            options
        );
        
        this.cutsceneScreen = new CutsceneScreen(
            this.cutsceneLayerName,
            this.scene,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            undefined,
            options
        );

        this.textDisplay = this.dialogueScreen
        
        this.cutsceneBackgroundTintOverlay = new TintEffectOverlay(
            this.cutsceneBackgroundTintLayerName,
            this.scene,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            new Color(0, 0, 0, 1)
        );
    }
    
    get sceneAssets() {
        return this.assetBundle;
    }

    set sceneAssets(value: AssetBundle) {
        this.assetBundle = value;
    }

    public update(deltaT: number): void {
        if (!this.isActive) {
            return;
        }
        
        if (!this.activeDialogue) {
            return;
        }
    
        if (!this.textDisplay.isTyping()) {
            this.stopDialogueSpeakingSFX();
        }

        if (this.dialogueChoiceActive) {
            this.textDisplay.update(deltaT);
            return;
        }

        if (this.ignoreNextConfirm) {
            this.ignoreNextConfirm = false;
            return;
        }

        if (!this.confirm()) {
            return;
        }
    
        if (this.textDisplay.isTyping()) {
            this.textDisplay.revealCurrentLine();
            this.stopDialogueSpeakingSFX();
            return;
        }

        if (this.shouldShowDialogueChoice()) {
            this.showDialogueChoicePrompt();
            return;
        }
    
        this.currentDialogueLine += 1;
    
        if (this.currentDialogueLine >= this.activeDialogue.lines.length) {
            this.textDisplay.completeRead();
            this.endDialogue();
            return;
        }
    
        this.textDisplay.showLine(
            this.activeDialogue.lines[this.currentDialogueLine]
        );
        this.invokeLineStartCallback();
        this.playDialogueNextSFX();
        this.playDialogueSpeakingSFX();
    }

    public startDialogue(dialogue: DialogueInteraction, speakerName?: string, options: DialogueStartOptions = {}): void {
        const ai = this.player.ai as PlayerAI;

        if (!this.isActive && this.controlModeBeforeDialogue === null) {
            this.controlModeBeforeDialogue = this.getControlModeToRestoreAfterDialogue(ai.controller.controlMode);
        }

        ai.controller.setControlMode(PlayerControlMode.DIALOGUE);

        this.activeSpeakerName = speakerName;
        this.activeStartOptions = { ...options };

        this.activeDialogue = dialogue;
        this.currentDialogueLine = 0;
        this.dialogueChoiceActive = false;
        this.dialogueChoiceResolved = false;
        this.ignoreNextConfirm = true;
        this.dialogueScreen.setLayoutMode(options.layoutMode ?? "bottom");
        this.textDisplay.hideChoices();
        this.textDisplay.setOnCompleteCallback(() => {
            dialogue.onComplete?.();
            this.handleDialogueCompleteAction(dialogue);
        });

        this.textDisplay.setSpeakerName(this.activeSpeakerName);

        this.textDisplay.showLine(
            dialogue.lines[this.currentDialogueLine]
        );
        this.invokeLineStartCallback();
        if (this.cutsceneMode) {
            this.cutsceneBackgroundTintOverlay.show();
        }

        this.playDialogueSpeakingSFX();
        this.isActive = true;
    }

    private invokeLineStartCallback(): void {
        if (!this.activeDialogue) {
            return;
        }

        this.activeStartOptions.onLineStart?.(
            this.currentDialogueLine,
            this.activeDialogue.lines[this.currentDialogueLine]
        );
    }

    protected shouldShowDialogueChoice(): boolean {
        if (!this.activeDialogue || this.dialogueChoiceResolved) {
            return false;
        }

        const choice = this.activeDialogue.choice;
        return !!choice && this.currentDialogueLine === choice.lineIndex;
    }

    protected showDialogueChoicePrompt(): void {
        if (!this.activeDialogue?.choice) {
            return;
        }

        const choice = this.activeDialogue.choice;
        this.dialogueChoiceActive = true;

        this.textDisplay.setChoices(
            choice.options.map((option: DialogueChoiceOption) => ({
                label: option.label,
                onSelect: () => {
                    this.dialogueChoiceActive = false;
                    this.dialogueChoiceResolved = true;
                    this.textDisplay.hideChoices();
                    option.onSelect?.();
                    this.handleDialogueChoiceAction(option);
                    if (option.showInteractionAfterSelect === false) {
                        this.endDialogue();
                        return;
                    }
                    this.startDialogue(option.interaction, this.activeSpeakerName, this.activeStartOptions);
                }
            }))
        );

        this.textDisplay.showChoices();
    }
    
    protected endDialogue(): void {
        this.isActive = false;
        this.stopDialogueSpeakingSFX();

        this.cutsceneBackgroundTintOverlay.hide();
        const dialogue = this.activeDialogue;
        const callbackHandledByReadCompletion = !!dialogue
            && !dialogue.choice
            && this.currentDialogueLine >= dialogue.lines.length;

        const ai = this.player.ai as PlayerAI;
        
        if (ai.controller.controlMode === PlayerControlMode.DIALOGUE) {
            ai.controller.setControlMode(this.controlModeBeforeDialogue ?? PlayerControlMode.GAMEPLAY);
        }

        this.activeDialogue = null;
        this.currentDialogueLine = 0;
        this.dialogueChoiceActive = false;
        this.dialogueChoiceResolved = false;
        this.ignoreNextConfirm = false;
        this.activeStartOptions = {};
        this.controlModeBeforeDialogue = null;
        if (!callbackHandledByReadCompletion) {
            this.cutsceneScreen.clearOnCompleteCallback();
            this.dialogueScreen.clearOnCompleteCallback();
            this.textDisplay.clearOnCompleteCallback();
        }
        this.cutsceneScreen.hideChoices();
        this.dialogueScreen.hideChoices();
        this.cutsceneScreen.hide();
        this.dialogueScreen.hide();
        this.cutsceneScreen.setSpeakerName(undefined);
        this.dialogueScreen.setSpeakerName(undefined);
        this.activeSpeakerName = undefined;
    }

    public setCutsceneMode(toggle: boolean): void {
        this.cutsceneMode = toggle;
        if (toggle) {
            this.textDisplay = this.cutsceneScreen;
        } else {
            this.textDisplay = this.dialogueScreen;
        }
    }

    private getControlModeToRestoreAfterDialogue(mode: PlayerControlMode): PlayerControlMode {
        if (mode === PlayerControlMode.LOCKED) {
            return PlayerControlMode.GAMEPLAY;
        }

        return mode;
    }

    private playDialogueSpeakingSFX(): void {
        AudioController.getInstance().playSFX(this.sceneAssets.sounds.dialogueSpeakingSFX.key, true, true);
    }

    private stopDialogueSpeakingSFX(): void {
        AudioController.getInstance().stopSound(this.sceneAssets.sounds.dialogueSpeakingSFX.key);
    }

    private playDialogueNextSFX(): void {
        AudioController.getInstance().playSFX(this.sceneAssets.sounds.dialogueNextSFX.key);
    }
}
