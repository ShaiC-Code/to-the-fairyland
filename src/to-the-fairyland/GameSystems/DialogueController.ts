import Updateable from "../../Wolfie2D/DataTypes/Interfaces/Updateable";
import Input from "../../Wolfie2D/Input/Input";
import Scene from "../../Wolfie2D/Scene/Scene";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import PlayerActor from "../Actors/PlayerActor";
import PlayerAI from "../AI/Player/PlayerAI";
import { PlayerControlMode, PlayerInput } from "../AI/Player/PlayerController";
import { AssetBundle } from "../Scenes/MappedAdventureScene";
import CutsceneScreen from "../UI/CutsceneScreen";
import DialogueScreen from "../UI/DialogueScreen";
import { UIScreenOptions } from "../UI/UIScreen";
import { DialogueChoiceOption, DialogueInteraction } from "./InteractionSystem/InteractionDatabase";

export default class DialogueController implements Updateable {
    private assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {},
        sounds: {}
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
    private cutsceneMode: boolean = false;
    
    private activeDialogue: DialogueInteraction | null = null;
    private activeSpeakerName: string | undefined;
    private currentDialogueLine: number = 0;
    private dialogueChoiceActive: boolean = false;
    private dialogueChoiceResolved: boolean = false;
    private ignoreNextConfirm: boolean = false;
    
    private readonly dialogueLayerName = "dialogueOverlay";
    private readonly cutsceneLayerName = "cutsceneOverlay";

    public isActive: boolean = false;

    constructor(
      scene: Scene,
      viewport: Viewport,
      player: PlayerActor,
      handleDialogueCompleteAction: (option: DialogueInteraction) => void,
      handleDialogueChoiceAction: (option: DialogueChoiceOption) => void,
      options?: UIScreenOptions
    ) {
        this.player = player;
        this.scene = scene;
        this.viewport = viewport;
        this.handleDialogueCompleteAction = handleDialogueCompleteAction;
        this.handleDialogueChoiceAction = handleDialogueChoiceAction;

        this.confirm = options?.uiActions?.confirm ?? (() => Input.isJustPressed(PlayerInput.INTERACT));

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
    }

    public startDialogue(dialogue: DialogueInteraction, speakerName?: string): void {
        const ai = this.player.ai as PlayerAI;
        ai.controller.setControlMode(PlayerControlMode.DIALOGUE);

        this.activeSpeakerName = speakerName;

        this.activeDialogue = dialogue;
        this.currentDialogueLine = 0;
        this.dialogueChoiceActive = false;
        this.dialogueChoiceResolved = false;
        this.ignoreNextConfirm = true;
        this.textDisplay.hideChoices();
        this.textDisplay.setOnCompleteCallback(() => {
            dialogue.onComplete?.();
            this.handleDialogueCompleteAction(dialogue);
        });

        this.textDisplay.setSpeakerName(this.activeSpeakerName);

        this.textDisplay.showLine(
            dialogue.lines[this.currentDialogueLine]
        );
        this.isActive = true;
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
                    this.startDialogue(option.interaction, this.activeSpeakerName);
                }
            }))
        );

        this.textDisplay.showChoices();
    }
    
    protected endDialogue(): void {
        this.isActive = false;
        const dialogue = this.activeDialogue;
        const callbackHandledByReadCompletion = !!dialogue
            && !dialogue.choice
            && this.currentDialogueLine >= dialogue.lines.length;

        const ai = this.player.ai as PlayerAI;
        ai.controller.setControlMode(PlayerControlMode.GAMEPLAY);

        this.activeDialogue = null;
        this.currentDialogueLine = 0;
        this.dialogueChoiceActive = false;
        this.dialogueChoiceResolved = false;
        this.ignoreNextConfirm = false;
        if (!callbackHandledByReadCompletion) {
            this.textDisplay.clearOnCompleteCallback();
        }
        this.textDisplay.hideChoices();
        this.textDisplay.hide();
        this.textDisplay.setSpeakerName(undefined);
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

    public playDialogueSFX(): void {
        return; // Placeholder for now, can be used for dialogue-specific sound effects in the future
    }
}
