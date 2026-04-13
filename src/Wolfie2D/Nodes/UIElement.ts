import CanvasNode from "./CanvasNode";
import Color from "../Utils/Color";
import Vec2 from "../DataTypes/Vec2";
import Input from "../Input/Input";

/**
 * The representation of a UIElement - the parent class of things like buttons
 */
export default abstract class UIElement extends CanvasNode {
	// Style attributes - TODO - abstract this into a style object/interface
	/** The backgound color */
	backgroundColor: Color;
	/** The border color */
	borderColor: Color;
	/** The border radius */
	borderRadius: number;
	/** The border width */
	borderWidth: number;
	/** The padding */
	padding: Vec2;

	// EventAttributes
	/** The reaction of this UIElement on a click */
	onClick: Function | undefined;
	/** The event propagated on click */
	onClickEventId: string | undefined;
	/** The reaction to the release of a click */
	onRelease: Function | undefined;
	/** The event propagated on the release of a click */
	onReleaseEventId: string | undefined;
	/** The reaction when a mouse enters this UIElement */
	onEnter: Function | undefined;
	/** The event propagated when a mouse enters this UIElement */
	onEnterEventId: string | undefined;
	/** The reaction when a mouse leaves this UIElement */
	onLeave: Function | undefined;
	/** The event propogated when a mouse leaves this UIElement */
	onLeaveEventId: string | undefined;

	/** Whether or not this UIElement is currently clicked on */
	protected isClicked: boolean;
	/** Whether or not this UIElement is currently hovered over */
	protected isEntered: boolean;
	/** Whether or not this UIElement is being kept highlighted by keyboard/controller focus */
	protected isFocused: boolean;
	/** Suppresses mouse hover highlight until the mouse position changes */
	protected suppressHoverUntilMouseMove: boolean;
	private suppressedMousePosition: Vec2 | null;

	constructor(position: Vec2){
		super();
		this.position = position;
		
		this.backgroundColor = new Color(0, 0, 0, 0);
		this.borderColor = new Color(0, 0, 0, 0);
		this.borderRadius = 5;
		this.borderWidth = 1;
		this.padding = Vec2.ZERO;

		this.onClick = undefined;
		this.onClickEventId = undefined;
		this.onRelease = undefined;
		this.onReleaseEventId = undefined;

		this.onEnter = undefined;
		this.onEnterEventId = undefined;
		this.onLeave = undefined;
		this.onLeaveEventId = undefined;

		this.isClicked = false;
		this.isEntered = false;
		this.isFocused = false;
		this.suppressHoverUntilMouseMove = false;
		this.suppressedMousePosition = null;
	}

	public suppressHoverUntilMouseMoves(): void {
		this.suppressHoverUntilMouseMove = true;
		this.isEntered = false;

		const mousePos = Input.getMousePosition();
		this.suppressedMousePosition = mousePos ? mousePos.clone() : null;
	}

	public setFocused(isFocused: boolean): void {
		this.isFocused = isFocused;
	}

	public clearEntered(): void {
		this.isEntered = false;
	}

	private hasMouseMovedFromSuppressedPosition(mousePos: Vec2): boolean {
		if (!this.suppressedMousePosition) {
			return true;
		}

		return mousePos.x !== this.suppressedMousePosition.x
			|| mousePos.y !== this.suppressedMousePosition.y;
	}

	// @deprecated
	setBackgroundColor(color: Color): void {
		this.backgroundColor = color;
	}

	// @deprecated
	setPadding(padding: Vec2): void {
		this.padding.copy(padding);
	}

	update(deltaT: number): void {
		super.update(deltaT);

		// See of this object was just clicked
		if(Input.isMouseJustPressed()){
			let clickPos = Input.getMousePressPosition();
			if(this.contains(clickPos.x, clickPos.y) && this.visible && !this.layer.isHidden()){
				this.isClicked = true;

				if(this.onClick !== undefined){
					this.onClick();
				}
				if(this.onClickEventId !== undefined){
					let data = {};
					this.emitter.fireEvent(this.onClickEventId, data);
				}
			}
		}

		// If the mouse wasn't just pressed, then we definitely weren't clicked
		if(!Input.isMousePressed()){
			if(this.isClicked){
				this.isClicked = false;
			}
		}

		// Check if the mouse is hovering over this element
		let mousePos = Input.getMousePosition();

		if (this.suppressHoverUntilMouseMove) {
			if (mousePos !== null && this.hasMouseMovedFromSuppressedPosition(mousePos)) {
				this.suppressHoverUntilMouseMove = false;
				this.suppressedMousePosition = null;
			} else {
				mousePos = null;
			}
		}

		const isHovering = mousePos !== null
			&& this.contains(mousePos.x, mousePos.y)
			&& this.visible
			&& !this.layer.isHidden();

		if(isHovering && !this.isEntered){
			this.isEntered = true;

			if(this.onEnter !== undefined){
				this.onEnter();
			}
			if(this.onEnterEventId !== undefined){
				let data = {};
				this.emitter.fireEvent(this.onEnterEventId, data);
			}

		} else if(!isHovering && this.isEntered) {
			this.isEntered = false;

			if(this.onLeave !== undefined){
				this.onLeave();
			}
			if(this.onLeaveEventId !== undefined){
				let data = {};
				this.emitter.fireEvent(this.onLeaveEventId, data);
			}
		} else if(this.isClicked) {
			// If mouse is dragged off of element while down, it is not clicked anymore
			this.isClicked = false;
		}
	}

	/**
	 * Overridable method for calculating background color - useful for elements that want to be colored on different after certain events
	 * @returns The background color of the UIElement
	 */
	calculateBackgroundColor(): Color {
		return this.backgroundColor;
	}

	/**
	 * Overridable method for calculating border color - useful for elements that want to be colored on different after certain events
	 * @returns The border color of the UIElement
	 */
	calculateBorderColor(): Color {
		return this.borderColor;
	}
}