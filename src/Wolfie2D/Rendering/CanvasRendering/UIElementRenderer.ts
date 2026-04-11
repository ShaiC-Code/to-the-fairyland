import Vec2 from "../../DataTypes/Vec2";
import Button from "../../Nodes/UIElements/Button";
import Label from "../../Nodes/UIElements/Label";
import Slider from "../../Nodes/UIElements/Slider";
import TextInput from "../../Nodes/UIElements/TextInput";
import TextBox from "../../Nodes/UIElements/TextBox";
import ResourceManager from "../../ResourceManager/ResourceManager";
import Scene from "../../Scene/Scene";
import MathUtils from "../../Utils/MathUtils";

/**
 * A utility class to help the @reference[CanvasRenderer] render @reference[UIElement]s
 */
export default class UIElementRenderer {
    protected resourceManager: ResourceManager;
    protected scene: Scene | null = null;
    protected ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D){
        this.resourceManager = ResourceManager.getInstance();
        this.ctx = ctx;
    }

    /**
     * Sets the scene of this UIElementRenderer
     * @param scene The current scene
     */
    setScene(scene: Scene): void {
        this.scene = scene;
    }

    /**
     * Renders a label
     * @param label The label to render
     */
    renderLabel(label: Label): void {
        // If the size is unassigned (by the user or automatically) assign it
        label.handleInitialSizing(this.ctx);
		
		// Grab the global alpha so we can adjust it for this render
		let previousAlpha = this.ctx.globalAlpha;

        // Get the font and text position in label
		this.ctx.font = label.getFontString();
		let offset = label.calculateTextOffset(this.ctx);

		// Stroke and fill a rounded rect and give it text
        const backgroundColor = label.calculateBackgroundColor();
        this.ctx.globalAlpha = previousAlpha * backgroundColor.a;
        this.ctx.fillStyle = backgroundColor.toStringRGBA();
		this.ctx.fillRoundedRect(-label.size.x/2, -label.size.y/2,
			label.size.x, label.size.y, label.borderRadius);
		
        const borderColor = label.calculateBorderColor();
        this.ctx.strokeStyle = borderColor.toStringRGBA();
        this.ctx.globalAlpha = previousAlpha * borderColor.a;
		this.ctx.lineWidth = label.borderWidth;
		this.ctx.strokeRoundedRect(-label.size.x/2, -label.size.y/2,
			label.size.x, label.size.y, label.borderRadius);

		this.ctx.fillStyle = label.calculateTextColor();
        this.ctx.globalAlpha = previousAlpha * label.textColor.a;
		this.ctx.fillText(label.text, offset.x - label.size.x/2, offset.y - label.size.y/2);
	
		this.ctx.globalAlpha = previousAlpha;
    }

    /**
     * Renders a button
     * @param button The button to render
     */
    renderButton(button: Button): void {
        this.renderLabel(button);
    }

    /**
     * Renders a slider
     * @param slider The slider to render
     */
    renderSlider(slider: Slider): void {
		// Grab the global alpha so we can adjust it for this render
		let previousAlpha = this.ctx.globalAlpha;
		this.ctx.globalAlpha = slider.getLayer().getAlpha();

        // Calcualate the slider size
        let sliderSize = new Vec2(slider.size.x, 2);

        // Draw the slider
		this.ctx.fillStyle = slider.sliderColor.toString();
		this.ctx.fillRoundedRect(-sliderSize.x/2, -sliderSize.y/2,
            sliderSize.x, sliderSize.y, slider.borderRadius);

        // Calculate the nib size and position
        let x = MathUtils.lerp(-slider.size.x/2, slider.size.x/2, slider.getValue());

        // Draw the nib
		this.ctx.fillStyle = slider.nibColor.toString();
		this.ctx.fillRoundedRect(x-slider.nibSize.x/2, -slider.nibSize.y/2,
            slider.nibSize.x, slider.nibSize.y, slider.borderRadius);

        // Reset the alpha
        this.ctx.globalAlpha = previousAlpha;
    }

    /**
     * Renders a textInput
     * @param textInput The textInput to render
     */
    renderTextInput(textInput: TextInput): void {
        // Show a cursor sometimes
        if(textInput.focused && textInput.cursorCounter % 60 > 30){
            textInput.text += "|";
        }

        this.renderLabel(textInput);

        if(textInput.focused){
            if(textInput.cursorCounter % 60 > 30){
                textInput.text = textInput.text.substring(0, textInput.text.length - 1);
            }

            textInput.cursorCounter += 1;
            if(textInput.cursorCounter >= 60){
                textInput.cursorCounter = 0;
            }
        }
    }

    /**
     * Renders a textbox with word wrapping support
     * @param textBox The textbox to render
     */
    renderTextBox(textBox: TextBox): void {
        // If the size is unassigned assign it
        textBox.handleInitialSizing(this.ctx);
        
        // Grab the global alpha so we can adjust it for this render
        let previousAlpha = this.ctx.globalAlpha;

        // Get the font
        this.ctx.font = textBox.getFontString();
        let lineHeight = textBox.fontSize * 1.2;
        let contentHeight = (textBox as any).wrappedLines.length * lineHeight;

        // Stroke and fill background
        const backgroundColor = textBox.calculateBackgroundColor();
        this.ctx.globalAlpha = previousAlpha * backgroundColor.a;
        this.ctx.fillStyle = backgroundColor.toStringRGBA();
        this.ctx.fillRoundedRect(-textBox.size.x/2, -textBox.size.y/2,
            textBox.size.x, textBox.size.y, textBox.borderRadius);
        
        const borderColor = textBox.calculateBorderColor();
        this.ctx.strokeStyle = borderColor.toStringRGBA();
        this.ctx.globalAlpha = previousAlpha * borderColor.a;
        this.ctx.lineWidth = textBox.borderWidth;
        this.ctx.strokeRoundedRect(-textBox.size.x/2, -textBox.size.y/2,
            textBox.size.x, textBox.size.y, textBox.borderRadius);

        // Set text color
        this.ctx.fillStyle = textBox.calculateTextColor();
        this.ctx.globalAlpha = previousAlpha * textBox.textColor.a;
        this.ctx.textBaseline = "top";

        // Calculate starting y position based on vertical alignment
        let startY = -textBox.size.y/2 + textBox.padding.y;
        let lines = (textBox as any).wrappedLines;

        // Render each line
        for(let i = 0; i < lines.length; i++){
            let y = startY + i * lineHeight;
            let x = -textBox.size.x/2 + textBox.padding.x;
            this.ctx.fillText(lines[i], x, y);
        }

        this.ctx.globalAlpha = previousAlpha;
    }

}