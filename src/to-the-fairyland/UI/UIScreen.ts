import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Layer from "../../Wolfie2D/Scene/Layer";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { CustomUIElementType } from "./CustomUIElements/CustomUIElementTypes";
import Color from "../../Wolfie2D/Utils/Color";
import Label, { VAlign, HAlign} from "../../Wolfie2D/Nodes/UIElements/Label";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Line from "../../Wolfie2D/Nodes/Graphics/Line";
import CanvasNode from "../../Wolfie2D/Nodes/CanvasNode";
import TextBox from "../../Wolfie2D/Nodes/UIElements/TextBox";
import Receiver from "../../Wolfie2D/Events/Receiver";
import Emitter from "../../Wolfie2D/Events/Emitter";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";

export default class UIScreen {
    protected scene: Scene;
    protected getViewportCenter: () => Vec2;
    protected getViewportHalfSize: () => Vec2;

    protected reciever: Receiver;
    protected emitter: Emitter;

    protected layerName: string;
    protected layer: Layer;
    protected elements: Map<string, CanvasNode | undefined>;
    protected isOpen: boolean = false;

    protected onClickSFXKey?: string;
    protected onEnterSFXKey?: string;
    protected onExitSFXKey?: string;
    protected onShowSFXKey?: string;
    protected onHideSFXKey?: string;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, options?: { onClickSFXKey?: string, onEnterSFXKey?: string, onExitSFXKey?: string, onShowSFXKey?: string, onHideSFXKey?: string }) {
        this.scene = scene;
        this.getViewportCenter = getViewportCenter;
        this.getViewportHalfSize = getViewportHalfSize;
        this.layerName = layerName;
        this.layer = this.scene.addUILayer(layerName);

        this.elements = new Map();
        this.reciever = new Receiver();
        this.emitter = new Emitter();

        options = options ?? {};
        this.onClickSFXKey = options.onClickSFXKey;
        this.onEnterSFXKey = options.onEnterSFXKey;
        this.onExitSFXKey = options.onExitSFXKey;
        this.onShowSFXKey = options.onShowSFXKey;
        this.onHideSFXKey = options.onHideSFXKey;
    }

    protected initializeUI(): void {}

    protected updateUIElement(element: CanvasNode | undefined, position: Vec2 | null, size: Vec2 | null): void {
      if (element) {
        if (position) {
          element.position.copy(position);
        }
        if (size) {
          element.size.copy(size);
        }
      }
    }

    private addUIElement(key: string, element: CanvasNode): void {
        this.elements.set(key, element);
    }

    public getUIElement(key: string): CanvasNode | undefined {
        return this.elements.get(key);
    }
    
    public show(): void {
        if (this.isOpen) return;
        this.playSFX(this.onShowSFXKey);
        this.isOpen = true;

        this.layer.setHidden(false);
    }

    public hide(): void {
        if (!this.isOpen) return;
        this.playSFX(this.onHideSFXKey);
        this.isOpen = false;

        this.layer.setHidden(true);
    }

    public getIsOpen(): boolean {
        return this.isOpen;
    }

    public destroy(): void {
        if (this.layer) {
            this.layer.setHidden(true);
        }
        this.isOpen = false;
    }

    protected addRect(key: string, position: Vec2, size: Vec2, color: Color): void {
        const rect = this.scene.add.graphic(GraphicType.RECT, this.layerName, {
            position: position,
            size: size
        });
        rect.color = color;
        this.addUIElement(key, rect);
    }

    protected addLine(key: string, start: Vec2, end: Vec2, thickness: number): void {
        const divider = <Line>this.scene.add.graphic(GraphicType.LINE, this.layerName, {
            start: start,
            end: end
        });
        divider.color = Color.WHITE;
        divider.thickness = thickness;
        this.addUIElement(key, divider);
    }
    
    protected addLabel(key: string, position: Vec2, size: Vec2, text: string, fontSize: number, options?: {halign?: string, valign?: string}): void {
        const { halign, valign } = options ?? {};

        const label = <Label>this.scene.add.uiElement(UIElementType.LABEL, this.layerName, {
            position: position,
            text: text
        });
        label.size.set(size.x, size.y);
        label.fontSize = fontSize;
        label.textColor = Color.WHITE;
        label.backgroundColor = Color.TRANSPARENT;
        label.borderColor = Color.TRANSPARENT;
        if (halign && Object.keys(HAlign).some(key => HAlign[key as keyof typeof HAlign] === halign)) {
            label.setHAlign(halign);
        }
        if (valign && Object.keys(VAlign).some(key => VAlign[key as keyof typeof VAlign] === valign)) {
            label.setVAlign(valign);
        }
        this.addUIElement(key, label);
    }
    
    protected addTextBox(key: string, position: Vec2, size: Vec2, text: string, fontSize: number, options?: {halign?: string, valign?: string, maxLines?: number}): void {
        const { halign, valign, maxLines } = options ?? {};

        const textBox = <TextBox>this.scene.add.uiElement(UIElementType.TEXT_BOX, this.layerName, {
            position: position
        });

        textBox.size.set(size.x, size.y);
        textBox.fontSize = fontSize;
        textBox.textColor = Color.WHITE;
        textBox.backgroundColor = Color.BLACK;
        textBox.padding.set(20, 20);
        textBox.borderColor = Color.WHITE;
        textBox.borderWidth = 8;
        textBox.borderRadius = 0;
        if (maxLines !== undefined) {
            textBox.maxLines = maxLines;
        }
        if (halign && Object.keys(HAlign).some(key => HAlign[key as keyof typeof HAlign] === halign)) {
            textBox.setHAlign(halign);
        }
        if (valign && Object.keys(VAlign).some(key => VAlign[key as keyof typeof VAlign] === valign)) {
            textBox.setVAlign(valign);
        }
        textBox.setText(text);

        this.addUIElement(key, textBox);
    }
    
    protected addButton(key: string, position: Vec2, size: Vec2, text: string, options?: { onClick?: () => void; onClickEventId?: string }): void {
        const { onClick, onClickEventId } = options ?? {};

        const button = this.scene.add.uiElement(UIElementType.BUTTON, this.layerName, {
            position: position,
            text: text
        });
        button.size.set(size.x, size.y);
        button.borderWidth = 2;
        button.borderColor = Color.WHITE;
        button.backgroundColor = Color.TRANSPARENT;
        button.onEnter = () => {this.playSFX(this.onEnterSFXKey);};
        button.onClick = () => {
            this.playSFX(this.onClickSFXKey);
            if (onClick !== undefined) {
                onClick();
            }
        };
        if (onClickEventId !== undefined) {
            button.onClickEventId = onClickEventId;
        }
        button.onLeave = () => {this.playSFX(this.onExitSFXKey);};
        this.addUIElement(key, button);
    }
    
    protected addHoverButton(key: string, position: Vec2, size: Vec2, text: string, options?: { onClick?: () => void; onClickEventId?: string }): void {
        const { onClick, onClickEventId } = options ?? {};

        const button = this.scene.add.uiElement(CustomUIElementType.HOVER_BUTTON, this.layerName, {
            position: position,
            text: text
        });
        button.size.set(size.x, size.y);
        button.borderWidth = 0;
        button.borderRadius = 0;
        button.onEnter = () => {this.playSFX(this.onEnterSFXKey);};
        button.onClick = () => {
            this.playSFX(this.onClickSFXKey);
            if (onClick !== undefined) {
                onClick();
            }
        };
        if (onClickEventId !== undefined) {
            button.onClickEventId = onClickEventId;
        }
        button.onLeave = () => {this.playSFX(this.onExitSFXKey);};
        this.addUIElement(key, button);
    }

    protected addUIImage(key: string, position: Vec2, imageKey: string, size?: Vec2): void {
        const imageElement = this.scene.add.customCanvasNode(CustomUIElementType.UI_IMAGE, this.layerName, {
            imageKey
        });

        imageElement.position.copy(position);

        if (size) {
            imageElement.size.copy(size);
        }

        this.addUIElement(key, imageElement);
    }

    private playSFX(key?: string): void {
        if (key) {
            this.emitter.fireEvent(GameEventType.PLAY_SFX, {key: key, loop: false, holdReference: false});
        }
    }
}