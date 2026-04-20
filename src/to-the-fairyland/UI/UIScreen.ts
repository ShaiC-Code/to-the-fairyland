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
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import Receiver from "../../Wolfie2D/Events/Receiver";
import Emitter from "../../Wolfie2D/Events/Emitter";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Updateable from "../../Wolfie2D/DataTypes/Interfaces/Updateable";

export type UIScreenActionBindings = {
    navigatePrevious: () => boolean;
    navigateNext: () => boolean;
    confirm: () => boolean;
};

export type UIScreenOptions = {
    onClickSFXKey?: string;
    onEnterSFXKey?: string;
    onExitSFXKey?: string;
    onShowSFXKey?: string;
    onHideSFXKey?: string;
    uiActions?: Partial<UIScreenActionBindings>;
};

export default class UIScreen implements Updateable {
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
    protected navigationButtonKeys: string[] = [];
    protected navigationButtonIndex: number = -1;
    private readonly navigationButtonEnterCallbacks: Array<Function | null> = [];
    private readonly navigationButtonLeaveCallbacks: Array<Function | null> = [];
    private readonly navigationOriginalCallbacksByKey: Map<string, { onEnter: Function | undefined; onLeave: Function | undefined }> = new Map();
    private uiActions: UIScreenActionBindings = {
        navigatePrevious: () => false,
        navigateNext: () => false,
        confirm: () => false
    };

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, options?: UIScreenOptions) {
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
        this.uiActions = {
            ...this.uiActions,
            ...options.uiActions
        };
    }

    protected initializeUI(): void {}

    protected onNavigationSelectionChanged(_index: number): void {}

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

    public update(deltaT: number): void {
        if (!this.isOpen) {
            return;
        }
        this.updateNavigation();
    }
    
    public show(): void {
        if (this.isOpen) return;
        this.playSFX(this.onShowSFXKey);
        this.isOpen = true;

        this.layer.setHidden(false);
        this.syncNavigationSelection();
    }

    public hide(): void {
        if (!this.isOpen) return;
        this.playSFX(this.onHideSFXKey);
        this.isOpen = false;

        this.layer.setHidden(true);
        this.clearNavigationSelection();
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

    protected addClickableOverlay(key: string, position: Vec2, size: Vec2, options?: { onClick?: () => void; onClickEventId?: string }): void {
        const { onClick, onClickEventId } = options ?? {};

        const clickableOverlay = this.scene.add.uiElement(CustomUIElementType.CLICKABLE_OVERLAY, this.layerName, {
            position: position
        });
        clickableOverlay.size.set(size.x, size.y);
        clickableOverlay.onEnter = () => {this.playSFX(this.onEnterSFXKey);};
        clickableOverlay.onClick = () => {
            this.playSFX(this.onClickSFXKey);
            if (onClick !== undefined) {
                onClick();
            }
        };
        if (onClickEventId !== undefined) {
            clickableOverlay.onClickEventId = onClickEventId;
        }
        clickableOverlay.onLeave = () => {this.playSFX(this.onExitSFXKey);};
        this.addUIElement(key, clickableOverlay);
    }

    protected addUIImage(key: string, position: Vec2, size: Vec2, imageKey: string): void {
        const imageElement = this.scene.add.customCanvasNode(CustomUIElementType.UI_IMAGE, this.layerName, {
            imageKey
        });
        imageElement.position.copy(position);
        const scaleX = imageElement.size.x !== 0 ? size.x / imageElement.size.x : 1;
        const scaleY = imageElement.size.y !== 0 ? size.y / imageElement.size.y : 1;
        imageElement.scale.set(scaleX, scaleY);
        this.addUIElement(key, imageElement);
    }

    protected playSFX(key?: string): void {
        if (key) {
            this.emitter.fireEvent(GameEventType.PLAY_SFX, {key: key, loop: false, holdReference: false});
        }
    }

    protected setNavigationButtons(buttonKeys: string[]): void {
        this.navigationButtonKeys = buttonKeys;
        this.navigationButtonEnterCallbacks.length = 0;
        this.navigationButtonLeaveCallbacks.length = 0;

        for (let i = 0; i < this.navigationButtonKeys.length; i++) {
            const buttonKey = this.navigationButtonKeys[i];
            const button = this.getNavigationButton(i);

            if (!button) {
                this.navigationButtonEnterCallbacks.push(null);
                this.navigationButtonLeaveCallbacks.push(null);
                continue;
            }

            if (!this.navigationOriginalCallbacksByKey.has(buttonKey)) {
                this.navigationOriginalCallbacksByKey.set(buttonKey, {
                    onEnter: button.onEnter,
                    onLeave: button.onLeave
                });
            }

            const previousCallbacks = this.navigationOriginalCallbacksByKey.get(buttonKey)!;
            const previousOnEnter = previousCallbacks.onEnter;
            const previousOnLeave = previousCallbacks.onLeave;

            if (previousOnEnter) {
                this.navigationButtonEnterCallbacks.push(previousOnEnter);
            }

            if (previousOnLeave) {
                this.navigationButtonLeaveCallbacks.push(previousOnLeave);
            }

            button.onEnter = () => {
                this.focusNavigationButton(i, true);
            };

            button.onLeave = () => {
                previousOnLeave?.call(button);
            };
        }

        this.navigationButtonIndex = this.findNextSelectableNavigationButtonIndex(0, 1);
        this.syncNavigationSelection();
    }

    protected updateNavigation(): void {
        if (this.navigationButtonKeys.length === 0) {
            return;
        }

        if (this.uiActions.navigatePrevious()) {
            this.selectPreviousNavigationButton();
        } else if (this.uiActions.navigateNext()) {
            this.selectNextNavigationButton();
        }

        if (this.uiActions.confirm()) {
            this.confirmNavigationButton();
        }
    }

    protected selectPreviousNavigationButton(): void {
        this.moveNavigationSelection(-1);
    }

    protected selectNextNavigationButton(): void {
        this.moveNavigationSelection(1);
    }

    protected confirmNavigationButton(): void {
        const button = this.getNavigationButton(this.navigationButtonIndex);

        if (!button || button.visible === false) {
            return;
        }

        button.onClick?.call(button);

        if (button.onClickEventId) {
            this.emitter.fireEvent(button.onClickEventId, {});
        }
    }

    protected syncNavigationSelection(): void {
        if (this.navigationButtonKeys.length === 0) {
            return;
        }

        const selectedButton = this.getNavigationButton(this.navigationButtonIndex);

        if (selectedButton && selectedButton.visible !== false) {
            selectedButton.setFocused(true);
            this.onNavigationSelectionChanged(this.navigationButtonIndex);
            return;
        }

        const nextIndex = this.findNextSelectableNavigationButtonIndex(0, 1);
        if (nextIndex >= 0) {
            this.focusNavigationButton(nextIndex, false);
        }
    }

    protected clearNavigationSelection(): void {
        if (this.navigationButtonIndex >= 0) {
            const button = this.getNavigationButton(this.navigationButtonIndex);
            if (button) {
                button.setFocused(false);
            }
        }

        this.navigationButtonIndex = -1;
        this.onNavigationSelectionChanged(this.navigationButtonIndex);
    }

    protected focusNavigationButton(index: number, playCallbacks: boolean): void {
        const nextIndex = this.findNextSelectableNavigationButtonIndex(index, 1);
        if (nextIndex < 0) {
            return;
        }

        const nextButton = this.getNavigationButton(nextIndex);

        const currentIndex = this.navigationButtonIndex;
        if (currentIndex === nextIndex) {
            const currentButton = this.getNavigationButton(currentIndex);
            if (currentButton) {
                currentButton.setFocused(true);
            }

            this.onNavigationSelectionChanged(nextIndex);

            if (playCallbacks) {
                this.navigationButtonEnterCallbacks[nextIndex]?.call(nextButton);
            }

            return;
        }

        const currentButton = this.getNavigationButton(currentIndex);

        if (currentButton) {
            currentButton.setFocused(false);
            if (playCallbacks) {
                this.navigationButtonLeaveCallbacks[currentIndex]?.call(currentButton);
            }
        }

        this.navigationButtonIndex = nextIndex;
        this.onNavigationSelectionChanged(nextIndex);

        if (nextButton) {
            nextButton.setFocused(true);
            if (playCallbacks) {
                this.navigationButtonEnterCallbacks[nextIndex]?.call(nextButton);
            }
        }
    }

    protected moveNavigationSelection(direction: -1 | 1): void {
        if (this.navigationButtonKeys.length === 0) {
            return;
        }

        this.suppressMouseHoverForNavigationButtons();

        const startIndex = this.navigationButtonIndex >= 0 ? this.navigationButtonIndex + direction : 0;
        const nextIndex = this.findNextSelectableNavigationButtonIndex(startIndex, direction);

        if (nextIndex >= 0) {
            this.focusNavigationButton(nextIndex, true);
        }
    }

    protected suppressMouseHoverForNavigationButtons(): void {
        for (let i = 0; i < this.navigationButtonKeys.length; i++) {
            const button = this.getNavigationButton(i);

            if (!button) {
                continue;
            }

            button.clearEntered();
            button.suppressHoverUntilMouseMoves();
        }
    }

    protected getNavigationButton(index: number): Button | undefined {
        if (index < 0 || index >= this.navigationButtonKeys.length) {
            return undefined;
        }

        return this.getUIElement(this.navigationButtonKeys[index]) as Button | undefined;
    }

    protected findNextSelectableNavigationButtonIndex(startIndex: number, step: number): number {
        if (this.navigationButtonKeys.length === 0) {
            return -1;
        }

        const length = this.navigationButtonKeys.length;
        let index = ((startIndex % length) + length) % length;

        for (let attempt = 0; attempt < length; attempt++) {
            const button = this.getNavigationButton(index);

            if (button && button.visible !== false) {
                return index;
            }

            index = ((index + step) % length + length) % length;
        }

        return -1;
    }
}