import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import TextBox from "../../Wolfie2D/Nodes/UIElements/TextBox";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import Color from "../../Wolfie2D/Utils/Color";
import UIScreen, { UIScreenOptions } from "./UIScreen";

type DialogueChoice = {
    label: string;
    onSelect?: () => void;
};

export default class DialogueChoiceBoxScreen extends UIScreen {
    private defaultRevealSpeed = 105;
    private choices: DialogueChoice[] = [];
    private choiceButtonKeys: string[] = [];
    private selectedChoiceIndex = 0;
    private choicesVisible = false;

    private readonly dialogueFontSize = 24;
    private readonly dialoguePaddingY = 20;
    private readonly choiceButtonSize = new Vec2(180, 48);
    private readonly choiceSafeZoneTopPadding = 6;
    private readonly choiceSafeZoneBottomPadding = 20;
    private readonly choiceSafeZoneHeight = this.choiceButtonSize.y + this.choiceSafeZoneTopPadding + this.choiceSafeZoneBottomPadding;

    private readonly selectedButtonBackground = new Color(255, 255, 255, 1);
    private readonly selectedButtonText = new Color(0, 0, 0, 1);
    private readonly unselectedButtonBackground = Color.TRANSPARENT;
    private readonly unselectedButtonText = Color.WHITE;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, initialChoices?: DialogueChoice[], options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);

        this.initializeUI();
        this.setChoices(initialChoices ?? [{ label: "Yes" }, { label: "No" }]);
    }

    protected initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);

        const boxSize = new Vec2(viewportSize.x - 80, 200);
        const boxPos = new Vec2(viewportHalfSize.x, viewportSize.y - boxSize.y / 2 - 40);

        this.addTextBox("dialogueText", boxPos, boxSize, "", this.dialogueFontSize, {
            halign: "left",
            valign: "top",
            maxLines: 3
        });

        this.configureChoiceSafeZone(boxSize);

        this.layer.setHidden(true);
    }

    private configureChoiceSafeZone(boxSize: Vec2): void {
        const textBox = this.getTextBox();

        textBox.padding.set(20, this.dialoguePaddingY);

        const availableTextHeight = boxSize.y - textBox.padding.y * 2 - this.choiceSafeZoneHeight;
        const maxLines = Math.max(1, Math.floor(availableTextHeight / this.dialogueFontSize));
        textBox.maxLines = maxLines;
    }

    private ensureChoiceButtons(requiredCount: number): void {
        if (requiredCount <= this.choiceButtonKeys.length) {
            return;
        }

        const buttonSize = this.choiceButtonSize.clone();

        for (let i = this.choiceButtonKeys.length; i < requiredCount; i++) {
            const key = `choiceBtn${i}`;

            this.addButton(key, Vec2.ZERO, buttonSize, "", { onClick: () => this.invokeChoice(i) });

            this.choiceButtonKeys.push(key);
        }
    }

    private layoutChoiceButtons(): void {
        const textBox = this.getTextBox();
        const viewportHalfSize = this.getViewportHalfSize();

        const buttonSize = this.choiceButtonSize.clone();
        const buttonGap = 24;
        const bottomY = textBox.position.y + textBox.size.y / 2;
        const buttonY = bottomY - this.choiceSafeZoneBottomPadding - buttonSize.y / 2;
        const totalWidth = this.choices.length * buttonSize.x + (this.choices.length - 1) * buttonGap;
        const startX = viewportHalfSize.x - totalWidth / 2 + buttonSize.x / 2;

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

    public setChoices(choices: DialogueChoice[]): void {
        if (choices.length === 0) {
            throw new Error("DialogueChoiceBoxScreen requires at least one choice.");
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
        this.updateChoiceHighlighting();
    }

    public hideChoices(): void {
        this.choicesVisible = false;
        this.layoutChoiceButtons();
    }

    public areChoicesVisible(): boolean {
        return this.choicesVisible;
    }

    public selectChoice(index: number): void {
        if (index < 0 || index >= this.choices.length) {
            return;
        }

        if (index === this.selectedChoiceIndex) {
            return;
        }

        this.selectedChoiceIndex = index;
        this.getChoiceButton(index).onEnter?.();
        this.updateChoiceHighlighting();
    }

    public selectPreviousChoice(): void {
        const previousIndex = (this.selectedChoiceIndex - 1 + this.choices.length) % this.choices.length;
        this.selectChoice(previousIndex);
    }

    public selectNextChoice(): void {
        const nextIndex = (this.selectedChoiceIndex + 1) % this.choices.length;
        this.selectChoice(nextIndex);
    }

    public confirmSelection(): number {
        const index = this.selectedChoiceIndex;
        this.getChoiceButton(index).onClick?.();
        return index;
    }

    public getSelectedChoiceIndex(): number {
        return this.selectedChoiceIndex;
    }

    public getSelectedChoiceLabel(): string {
        return this.choices[this.selectedChoiceIndex].label;
    }

    public getTextBox(): TextBox {
        return this.getUIElement("dialogueText") as TextBox;
    }

    public showLine(line: string, charsPerSecond: number = this.defaultRevealSpeed): void {
        const textBox = this.getTextBox();
        textBox.setText(line);
        textBox.startTypewriter(charsPerSecond);
        this.show();
    }

    public revealCurrentLine(): void {
        this.getTextBox().stopTypewriter(true);
    }

    public isTyping(): boolean {
        return this.getTextBox().typingActive;
    }

}
