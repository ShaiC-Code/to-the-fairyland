import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import TextBox from "../../Wolfie2D/Nodes/UIElements/TextBox";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import Color from "../../Wolfie2D/Utils/Color";
import UIScreen, { UIScreenOptions } from "./UIScreen";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";

type DialogueChoice = {
    label: string;
    onSelect?: () => void;
};

type TextHint = {
    color?: "yellow" | "red" | "default";
};

export type DialogueLayoutMode = "bottom" | "topRightQuarter";

export default class DialogueScreen extends UIScreen {
    private textBox!: TextBox;
    private nameBox!: Label;
    private defaultRevealSpeed = 105;
    private choices: DialogueChoice[] = [];
    private choiceButtonKeys: string[] = [];
    private selectedChoiceIndex = 0;
    private choicesVisible = false;
    private layoutMode: DialogueLayoutMode = "bottom";
    private onCompleteCallback: (() => void) | null = null;

    private readonly nameFontSize = 28;
    private readonly dialogueFontSize = 28;
    private readonly dialoguePaddingY = 24;
    private readonly nameBoxSize = new Vec2(140, 52);
    private readonly choiceButtonSize = new Vec2(180, 52);
    private readonly choiceSafeZoneTopPadding = 6;
    private readonly choiceSafeZoneBottomPadding = 24;
    private readonly choiceSafeZoneHeight = this.choiceButtonSize.y + this.choiceSafeZoneTopPadding + this.choiceSafeZoneBottomPadding;

    private readonly topRightQuarterMargin = 90;
    private readonly topRightQuarterWidth = 350;
    private readonly topRightQuarterHeight = 300;

    private readonly selectedButtonBackground = new Color(255, 255, 255, 1);
    private readonly selectedButtonText = new Color(0, 0, 0, 1);
    private readonly unselectedButtonBackground = Color.TRANSPARENT;
    private readonly unselectedButtonText = Color.WHITE;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, initialChoices?: DialogueChoice[], options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);
        this.initializeUI();
        this.setChoices(initialChoices ?? [{ label: "Yes" }, { label: "No" }]);
    }

    protected override initializeUI(): void {
        const { boxPos, boxSize } = this.getDialogueBoxLayout();
        const nameBoxPos = this.getNameBoxPosition(boxPos, boxSize);

        this.addLabel("speakerNameText", nameBoxPos, this.nameBoxSize, "", this.nameFontSize, {
            halign: "center",
            valign: "center"
        });
        this.nameBox = this.getUIElement("speakerNameText") as Label;
        this.nameBox.backgroundColor = Color.BLACK;
        this.nameBox.borderColor = Color.WHITE;
        this.nameBox.borderWidth = 8;
        this.nameBox.borderRadius = 0;
        this.nameBox.textColor = Color.WHITE;
        this.nameBox.visible = false;

        this.addTextBox("dialogueText", boxPos, boxSize, "", this.dialogueFontSize, {
            halign: "left",
            valign: "top",
            maxLines: 3
        });
        this.textBox = this.getUIElement("dialogueText") as TextBox;

        this.layoutDialogueElements();
        this.layer.setHidden(true);
    }

    private configureChoiceSafeZone(boxSize: Vec2): void {
        this.textBox.padding.set(20, this.dialoguePaddingY);

        const availableTextHeight = boxSize.y - this.textBox.padding.y * 2 - this.choiceSafeZoneHeight;
        const maxLines = Math.max(1, Math.floor(availableTextHeight / this.dialogueFontSize));
        this.textBox.maxLines = maxLines;
    }

    private ensureChoiceButtons(requiredCount: number): void {
        let createdButtons = false;

        if (requiredCount <= this.choiceButtonKeys.length) {
            return;
        }

        const buttonSize = this.choiceButtonSize.clone();

        for (let i = this.choiceButtonKeys.length; i < requiredCount; i++) {
            const key = `choiceBtn${i}`;

            this.addButton(key, Vec2.ZERO, buttonSize, "", { onClick: () => this.invokeChoice(i) });

            this.choiceButtonKeys.push(key);
            createdButtons = true;
        }

        if (createdButtons) {
            // Register navigation callbacks only for newly-created button instances.
            this.setNavigationButtons(this.choiceButtonKeys);
        }
    }

    public setLayoutMode(mode: DialogueLayoutMode): void {
        this.layoutMode = mode;
        this.layoutDialogueElements();
        this.layoutChoiceButtons();
    }

    private getDialogueBoxLayout(): { boxPos: Vec2; boxSize: Vec2 } {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
    
        if (this.layoutMode === "topRightQuarter") {
            const boxSize = new Vec2(
                this.topRightQuarterWidth,
                this.topRightQuarterHeight
            );
            const boxPos = new Vec2(
                viewportSize.x - this.topRightQuarterMargin - boxSize.x / 2,
                this.topRightQuarterMargin + boxSize.y / 2
            );
    
            return { boxPos, boxSize };
        }
    
        const boxSize = new Vec2(viewportSize.x - 80, 200);
        const boxPos = new Vec2(
            viewportHalfSize.x,
            viewportSize.y - boxSize.y / 2 - 40
        );
    
        return { boxPos, boxSize };
    }

    private getNameBoxPosition(boxPos: Vec2, boxSize: Vec2): Vec2 {
        const nameBoxGap = 0;

        return new Vec2(
            boxPos.x - boxSize.x / 2 + this.nameBoxSize.x / 2,
            boxPos.y - boxSize.y / 2 - this.nameBoxSize.y / 2 - nameBoxGap
        );
    }
    
    private layoutDialogueElements(): void {
        const { boxPos, boxSize } = this.getDialogueBoxLayout();
        const nameBoxPos = this.getNameBoxPosition(boxPos, boxSize);
    
        this.nameBox.position.copy(nameBoxPos);
        this.nameBox.size.copy(this.nameBoxSize);
    
        this.textBox.position.copy(boxPos);
        this.textBox.size.copy(boxSize);
    
        this.configureChoiceSafeZone(boxSize);
    }
    

    private layoutChoiceButtons(): void {
        const buttonSize = this.choiceButtonSize.clone();
        const buttonGap = 24;
        const bottomY = this.textBox.position.y + this.textBox.size.y / 2;
        const buttonY = bottomY - this.choiceSafeZoneBottomPadding - buttonSize.y / 2;
        const availableWidth = this.textBox.size.x - 40;
        const totalGap = (this.choices.length - 1) * buttonGap;
        const maxButtonWidth = (availableWidth - totalGap) / this.choices.length;

        buttonSize.x = Math.min(buttonSize.x, Math.max(96, maxButtonWidth));

        const totalWidth = this.choices.length * buttonSize.x + (this.choices.length - 1) * buttonGap;
        const startX = this.textBox.position.x - totalWidth / 2 + buttonSize.x / 2;

        for (let i = 0; i < this.choiceButtonKeys.length; i++) {
            const button = this.getChoiceButton(i);

            if (i < this.choices.length) {
                button.visible = this.choicesVisible;
                button.position.set(startX + i * (buttonSize.x + buttonGap), buttonY);
                button.size.copy(buttonSize);
            } else {
                button.visible = false;
            }
        }
    }

    private getChoiceButton(index: number): Button {
        return this.getUIElement(this.choiceButtonKeys[index]) as Button;
    }

    private updateChoiceHighlighting(): void {
        for (let i = 0; i < this.choiceButtonKeys.length; i++) {
            const button = this.getChoiceButton(i);
            if (i >= this.choices.length) {
                continue;
            }

            const isSelected = i === this.selectedChoiceIndex;

            button.text = this.choices[i].label;
            button.backgroundColor = isSelected ? this.selectedButtonBackground : this.unselectedButtonBackground;
            button.textColor = isSelected ? this.selectedButtonText : this.unselectedButtonText;
            button.borderColor = Color.WHITE;
            button.borderWidth = isSelected ? 4 : 2;
        }
    }

    private invokeChoice(index: number): void {
        this.selectedChoiceIndex = index;
        this.updateChoiceHighlighting();
        this.choices[index].onSelect?.();
    }

    protected override onNavigationSelectionChanged(index: number): void {
        if (index < 0 || index >= this.choices.length) {
            return;
        }

        this.selectedChoiceIndex = index;
        this.updateChoiceHighlighting();
    }

    public setChoices(choices: DialogueChoice[]): void {
        if (choices.length === 0) {
            throw new Error("DialogueScreen requires at least one choice.");
        }

        this.choices = choices;
        this.ensureChoiceButtons(this.choices.length);
        this.layoutChoiceButtons();

        this.selectedChoiceIndex = 0;
        this.updateChoiceHighlighting();
    }

    public showChoices(): void {
        this.choicesVisible = true;
        this.layoutChoiceButtons();
        this.syncNavigationSelection();
        this.updateChoiceHighlighting();
    }

    public hideChoices(): void {
        this.choicesVisible = false;
        this.layoutChoiceButtons();
    }

    public setOnCompleteCallback(callback?: () => void): void {
        this.onCompleteCallback = callback ?? null;
    }

    public completeRead(): void {
        const callback = this.onCompleteCallback;
        this.clearOnCompleteCallback();

        callback?.();
    }

    public clearOnCompleteCallback(): void {
        this.onCompleteCallback = null;
    }

    public areChoicesVisible(): boolean {
        return this.choicesVisible;
    }

    public showLine(line: string, charsPerSecond: number = this.defaultRevealSpeed): void {
        const { clean, hints } = this.parseTextHints(line);

        this.applyTextHints(hints);

        this.textBox.setText(clean);
        this.textBox.startTypewriter(charsPerSecond);
        this.show();
    }

    public revealCurrentLine(): void {
        this.textBox.stopTypewriter(true);
    }

    public isTyping(): boolean {
        return this.textBox.typingActive;
    }

    public setSpeakerName(name?: string): void {
        if (!name) {
            this.nameBox.visible = false;
            return;
        }
    
        this.nameBox.setText(name);
        this.nameBox.visible = true;
    }

    private applyTextHints(hints: TextHint): void {
        switch (hints.color) {
        case "yellow":
            this.textBox.setTextColor(Color.YELLOW);
            break;
        case "red":
            this.textBox.setTextColor(Color.RED);
            break;
        default:
            this.textBox.setTextColor(Color.WHITE);
        }
    }

    private parseTextHints(line: string): { clean: string; hints: TextHint } {
        const regex = /<([^>]+)>/g;

        let match;
        const tags: string[] = [];
        while ((match = regex.exec(line)) !== null) {
            tags.push(match[1]);
        }

        let hints: TextHint = {};
        for (const tag of tags) {
            switch (tag) {
                case "yellow":
                    hints.color = "yellow";
                    break;
                case "red":
                    hints.color = "red";
                    break;
            }
        }

        const clean = line.replace(/<[^>]+>/g, "");

        return { clean, hints };
    }
}
