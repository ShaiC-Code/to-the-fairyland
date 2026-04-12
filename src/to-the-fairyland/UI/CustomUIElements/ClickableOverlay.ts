import Button from "../../../Wolfie2D/Nodes/UIElements/Button";
import Color from "../../../Wolfie2D/Utils/Color";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";

export default class ClickableOverlay extends Button {
    constructor(position: Vec2){
        super(position, "");

        // Keep the overlay invisible regardless of hover/click state.
        this.backgroundColor = Color.TRANSPARENT;
        this.borderColor = Color.TRANSPARENT;
        this.textColor = Color.TRANSPARENT;
        this.borderWidth = 0;
    }

    calculateBackgroundColor(): Color {
        return Color.TRANSPARENT;
    }

    calculateBorderColor(): Color {
        return Color.TRANSPARENT;
    }

    calculateTextColor(): string {
        return Color.TRANSPARENT.toStringRGBA();
    }
}
