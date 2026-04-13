import Button from "../../../Wolfie2D/Nodes/UIElements/Button";
import Color from "../../../Wolfie2D/Utils/Color";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";

export default class HoverButton extends Button {
    normalBackgroundColor: Color;
    normalBorderColor: Color;
    normalTextColor: Color;
    
    hoverBackgroundColor: Color;
    hoverBorderColor: Color;
    hoverTextColor: Color;

    constructor(position: Vec2, text: string){
        super(position, text);
        
        // Define hover and normal states
        this.normalBackgroundColor = Color.TRANSPARENT;
        this.normalBorderColor = Color.TRANSPARENT;
        this.normalTextColor = Color.WHITE;
        
        this.hoverBackgroundColor = Color.WHITE;
        this.hoverBorderColor = Color.WHITE;
        this.hoverTextColor = Color.BLACK;
        
        // Set initial appearance
        this.backgroundColor = this.normalBackgroundColor;
        this.borderColor = this.normalBorderColor;
        this.textColor = this.normalTextColor;
    }

    calculateBackgroundColor(): Color {
        return (this.isEntered || this.isFocused) ? this.hoverBackgroundColor : this.normalBackgroundColor;
    }

    calculateBorderColor(): Color {
        return (this.isEntered || this.isFocused) ? this.hoverBorderColor : this.normalBorderColor;
    }

    calculateTextColor(): string {
        return ((this.isEntered || this.isFocused) ? this.hoverTextColor : this.normalTextColor).toStringRGBA();
    }
}
