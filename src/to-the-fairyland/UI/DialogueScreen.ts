import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import TextBox from "../../Wolfie2D/Nodes/UIElements/TextBox";
import UIScreen from "./UIScreen";

export default class DialogueScreen extends UIScreen {
    private defaultRevealSpeed = 105;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, options?: { onClickSFXKey?: string, onEnterSFXKey?: string, onExitSFXKey?: string, onShowSFXKey?: string, onHideSFXKey?: string }) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);

        this.initializeUI();
    }

    protected initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);

        const boxSize = new Vec2(viewportSize.x - 80, 140);
        const boxPos = new Vec2(viewportHalfSize.x, viewportSize.y - boxSize.y / 2 - 24);

        this.addTextBox("dialogueText", boxPos, boxSize, "", 24, {
            halign: "left",
            valign: "top",
            maxLines: 3
        });

        this.layer.setHidden(true);
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