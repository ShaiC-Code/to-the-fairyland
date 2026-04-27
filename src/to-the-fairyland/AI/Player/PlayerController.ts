import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Input from "../../../Wolfie2D/Input/Input";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";

/**
 * Strings used in the key binding for the player
 */
export enum PlayerInput {
    MOVE_UP = "MOVE_UP",
    MOVE_DOWN = "MOVE_DOWN",
    MOVE_LEFT = "MOVE_LEFT",
    MOVE_RIGHT = "MOVE_RIGHT",
    INTERACT = "INTERACT",
    INVENTORY = "INVENTORY",
    PAUSE = "PAUSE"
}

export enum PlayerControlMode {
    GAMEPLAY,
    DIALOGUE,
    LOCKED
}

type VerticalDirection = "up" | "down";
type HorizontalDirection = "left" | "right";
type HeldDirection = VerticalDirection | HorizontalDirection;

const AllowedInputsByMode: Record<PlayerControlMode, ReadonlySet<PlayerInput>> = {
    [PlayerControlMode.GAMEPLAY]: new Set([
        PlayerInput.MOVE_UP,
        PlayerInput.MOVE_DOWN,
        PlayerInput.MOVE_LEFT,
        PlayerInput.MOVE_RIGHT,
        PlayerInput.INTERACT,
        PlayerInput.INVENTORY,
        PlayerInput.PAUSE
    ]),
    [PlayerControlMode.DIALOGUE]: new Set([
        PlayerInput.MOVE_UP,
        PlayerInput.MOVE_DOWN,
        PlayerInput.MOVE_LEFT,
        PlayerInput.MOVE_RIGHT,
        PlayerInput.INTERACT
    ]),
    [PlayerControlMode.LOCKED]: new Set()
};

/**
 * The PlayerController class handles processing the input recieved from the user and exposes  
 * a set of methods to make dealing with the user input a bit simpler.
 */
export default class PlayerController {

    /** The GameNode that owns the AI */
    protected owner: AnimatedSprite;

    constructor(owner: AnimatedSprite) {
        this.owner = owner;
    }

    //End of the array is the highest priority
    private heldVertical: VerticalDirection[] = [];
    private heldHorizontal: HorizontalDirection[] = [];

    // Hold the state of if the key is pressed or not, multiple keys can be held at the same time
    private previousPressed: Record<HeldDirection, boolean> = {
        up: false,
        down: false,
        left: false,
        right: false
    };

    public controlMode: PlayerControlMode = PlayerControlMode.GAMEPLAY;

    public setControlMode(mode: PlayerControlMode): void {
        this.controlMode = mode;

        if (mode !== PlayerControlMode.GAMEPLAY) {
            this.heldVertical = [];
            this.heldHorizontal = [];
        }
    }

    public allowsInput(input: PlayerInput): boolean {
        return AllowedInputsByMode[this.controlMode].has(input);
    }

    public isPressed(input: PlayerInput): boolean {
        return this.allowsInput(input) && Input.isPressed(input);
    }

    public isJustPressed(input: PlayerInput): boolean {
        return this.allowsInput(input) && Input.isJustPressed(input);
    }

    public update(): void {
        const movementEnabled = this.controlMode === PlayerControlMode.GAMEPLAY;

        this.syncDirection("up", movementEnabled && Input.isPressed(PlayerInput.MOVE_UP));
        this.syncDirection("down", movementEnabled && Input.isPressed(PlayerInput.MOVE_DOWN));
        this.syncDirection("left", movementEnabled && Input.isPressed(PlayerInput.MOVE_LEFT));
        this.syncDirection("right", movementEnabled && Input.isPressed(PlayerInput.MOVE_RIGHT));
    }

    private syncDirection(direction: HeldDirection, pressed: boolean): void {
        const wasPressed = this.previousPressed[direction];

        // Newly pressed key 
        if (pressed && !wasPressed) {
            this.removeDirection(direction);
            this.pushDirection(direction);
        }

        // Key was released
        if (!pressed && wasPressed) {
            this.removeDirection(direction);
        }

        this.previousPressed[direction] = pressed;
    }

    
    private pushDirection(direction: HeldDirection): void {
        if (direction === "up" || direction === "down") {
            this.heldVertical.push(direction);
        } else {
            this.heldHorizontal.push(direction);
        }
    }

    private removeDirection(direction: HeldDirection): void {
        if (direction === "up" || direction === "down") {
            this.heldVertical = this.heldVertical.filter(dir => dir !== direction);
        } else {
            this.heldHorizontal = this.heldHorizontal.filter(dir => dir !== direction);
        }
    }

    /**
     * Gets the direction the player should move based on input from the keyboard. 
     * @returns a Vec2 indicating the direction the player should move. 
     */
    public get moveDir(): Vec2 { 
        if (this.controlMode !== PlayerControlMode.GAMEPLAY) {
            return Vec2.ZERO;
        }

        let dir: Vec2 = Vec2.ZERO;
        dir.y = (Input.isPressed(PlayerInput.MOVE_UP) ? -1 : 0) + (Input.isPressed(PlayerInput.MOVE_DOWN) ? 1 : 0);
		dir.x = (Input.isPressed(PlayerInput.MOVE_LEFT) ? -1 : 0) + (Input.isPressed(PlayerInput.MOVE_RIGHT) ? 1 : 0);
        return dir.normalize();
    }

    /** 
     * Gets the direction the player should be facing based on the position of the
     * mouse around the player
     * @return a Vec2 representing the direction the player should face.
     */
    public get faceDir(): Vec2 { return this.owner.position.dirTo(Input.getGlobalMousePosition()); }

    /**
     * Gets the rotation of the players sprite based on the direction the player
     * should be facing.
     * @return a number representing how much the player should be rotated
     */
    public get rotation(): number { return Vec2.UP.angleToCCW(this.faceDir); }

    /** 
     * Checks if the player is attempting to interact.
     * @return true if the player is attempting to interact; false otherwise.
     */
    public get interacting(): boolean {
        return this.controlMode === PlayerControlMode.GAMEPLAY && this.isJustPressed(PlayerInput.INTERACT);
    }

    public get tileInput(): Vec2 {
        if (this.controlMode !== PlayerControlMode.GAMEPLAY) {
            return Vec2.ZERO;
        }
        
        const vertical = this.heldVertical[this.heldVertical.length - 1];
        const horizontal = this.heldHorizontal[this.heldHorizontal.length - 1];

        return new Vec2(
            horizontal === "left" ? -1 : horizontal === "right" ? 1 : 0,
            vertical === "up" ? -1 : vertical === "down" ? 1 : 0
        );
    }
}
