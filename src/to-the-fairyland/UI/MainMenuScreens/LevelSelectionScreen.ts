import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Input from "../../../Wolfie2D/Input/Input";
import UIElement from "../../../Wolfie2D/Nodes/UIElement";
import UIScreen, { UIScreenOptions } from "../UIScreen";
import { LevelSelectionId } from "../../GameSystems/GameSessionSystem/LevelCheckpointMapping";

export default class LevelSelectionScreen extends UIScreen {
    private readonly levelNames: Map<string, string> = new Map([
        ["level1", "Epilogue"],
        ["level2", "Entering Village"],
        ["level3", "Leaving Village"],
        ["level4", "Returned to Village"],
        ["level5", "Cliff Jump"],
        ["level6", "After the Fall"],
        ["level7", "Entering Great Tree"],
        ["level8", "Leaving Great Tree"],
        ["level9", "The Desert"],
        ["level10", "Desert Path"],
        ["level11", "Desert Pond"],
        ["level12", "Drowning"]
    ]);
    
    private unlockedLevels = new Set<LevelSelectionId>();
    private menuButtonKeys: string[] = [];
    private visibleWindowStartIndex = 0;
    private readonly visibleWindowSize = 10;
    private listTop = 0;
    private listCenterX = 0;
    private verticalOffset = 60;
    private holdRepeatDirection: -1 | 1 | null = null;
    private holdRepeatTimer = 0;
    private readonly holdRepeatInitialDelay = 0.35;
    private readonly holdRepeatInterval = 0.1;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);
        this.initializeUI();
    }

    protected override initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const screenTop = screenCenter.y - viewportHalfSize.y + 100;
        const screenLeft = screenCenter.x - viewportHalfSize.x + 100;
        const screenRight = screenCenter.x + viewportHalfSize.x - 100;
        this.listTop = screenTop + 120;
        this.listCenterX = screenCenter.x;
        this.verticalOffset = 60;

        const levelButtonSize = new Vec2(viewportSize.x - 200, 50);
        const levels = Array.from(this.levelNames.keys());
        const levelButtons = levels.map((levelId, i) => ({
            key: `${levelId}Btn`,
            pos: new Vec2(this.listCenterX, this.listTop + this.verticalOffset * i),
            text: this.levelNames.get(levelId) || `Level ${i + 1}`,
            eventId: levelId
        }));
        
        levelButtons.push({
            key: "backBtn",
            pos: new Vec2(this.listCenterX, this.listTop + this.verticalOffset * levelButtons.length),
            text: "BACK",
            eventId: "backToMain"
        });
        this.menuButtonKeys = levelButtons.map(button => button.key);
        
        // Add Level Select label
        this.addLabel("levelMenuLabel", new Vec2(screenCenter.x, screenTop), new Vec2(viewportSize.x - 200, 50), "LEVEL SELECT", 48, {"halign": "left", "valign": "center"});

        // Add divider line
        this.addLine("divider", new Vec2(screenLeft, screenTop + 40), new Vec2(screenRight, screenTop + 40), 2);

        // Add level buttons
        for (const button of levelButtons) {
            this.addHoverButton(button.key, button.pos, levelButtonSize, button.text, {onClickEventId: button.eventId});
        }

        this.setNavigationButtons(this.menuButtonKeys);
        this.layoutVisibleWindow();

        // Hide by default
        this.layer.setHidden(true);
    }

    public override update(deltaT: number): void {
        if (!this.isOpen) {
            this.resetHoldRepeat();
            return;
        }

        if (this.ignoreNextNavigationInput) {
            this.ignoreNextNavigationInput = false;
            this.resetHoldRepeat();
            return;
        }

        this.updateWindowedNavigation(deltaT);
    }

    protected override syncNavigationSelection(): void {
        if (this.menuButtonKeys.length === 0) {
            return;
        }

        let index = this.navigationButtonIndex;
        if (index < 0 || !this.isNavigationIndexEnabled(index)) {
            index = this.findNextEnabledNavigationIndex(0, 1);
        }

        if (index < 0) {
            return;
        }

        this.ensureIndexInVisibleWindow(index);
        this.layoutVisibleWindow();
        this.focusNavigationButton(index, false);
    }

    protected override selectPreviousNavigationButton(): void {
        this.moveWindowedSelection(-1);
    }

    protected override selectNextNavigationButton(): void {
        this.moveWindowedSelection(1);
    }

    protected override onNavigationSelectionChanged(index: number): void {
        if (index < 0) {
            return;
        }

        this.ensureIndexInVisibleWindow(index);
        this.layoutVisibleWindow();
    }

    public setUnlockedLevels(unlockedLevels: Set<LevelSelectionId>): void {
        this.unlockedLevels = unlockedLevels;
        for (const levelId of this.levelNames.keys()) {
            const buttonKey = `${levelId}Btn`;
            const isUnlocked = this.unlockedLevels.has(levelId as LevelSelectionId);
            this.setUIElementEnabled(buttonKey, isUnlocked);
        }

        this.syncNavigationSelection();
    }

    private moveWindowedSelection(direction: -1 | 1): void {
        if (this.menuButtonKeys.length === 0) {
            return;
        }

        this.suppressMouseHoverForNavigationButtons();

        const startIndex = this.navigationButtonIndex >= 0
            ? this.navigationButtonIndex + direction
            : 0;
        const nextIndex = this.findNextEnabledNavigationIndex(startIndex, direction);

        if (nextIndex < 0) {
            return;
        }

        this.ensureIndexInVisibleWindow(nextIndex);
        this.layoutVisibleWindow();
        this.focusNavigationButton(nextIndex, true);
    }

    private updateWindowedNavigation(deltaT: number): void {
        this.updateScrollWindow();

        const pressedDirection = this.getPressedNavigationDirection();
        const heldDirection = this.getHeldNavigationDirection();

        if (pressedDirection !== null) {
            this.moveWindowedSelection(pressedDirection);
            this.holdRepeatDirection = pressedDirection;
            this.holdRepeatTimer = this.holdRepeatInitialDelay;
        } else if (heldDirection !== null) {
            this.updateHeldNavigationRepeat(heldDirection, deltaT);
        } else {
            this.resetHoldRepeat();
        }

        if (this.uiActions.confirm()) {
            this.confirmNavigationButton();
        }
    }

    private updateScrollWindow(): void {
        if (!Input.didJustScroll()) {
            return;
        }

        const scrollDirection = Input.getScrollDirection();
        const maxStartIndex = Math.max(0, this.menuButtonKeys.length - this.visibleWindowSize);
        const nextStartIndex = Math.max(
            0,
            Math.min(this.visibleWindowStartIndex + scrollDirection, maxStartIndex)
        );

        if (nextStartIndex === this.visibleWindowStartIndex) {
            return;
        }

        this.visibleWindowStartIndex = nextStartIndex;
        this.layoutVisibleWindow();
        this.suppressMouseHoverForNavigationButtons();
    }

    private updateHeldNavigationRepeat(direction: -1 | 1, deltaT: number): void {
        if (this.holdRepeatDirection !== direction) {
            this.holdRepeatDirection = direction;
            this.holdRepeatTimer = this.holdRepeatInitialDelay;
            return;
        }

        this.holdRepeatTimer -= deltaT;
        while (this.holdRepeatTimer <= 0) {
            this.moveWindowedSelection(direction);
            this.holdRepeatTimer += this.holdRepeatInterval;
        }
    }

    private getPressedNavigationDirection(): -1 | 1 | null {
        const previous = this.uiActions.navigatePrevious();
        const next = this.uiActions.navigateNext();

        if (previous === next) {
            return null;
        }

        return previous ? -1 : 1;
    }

    private getHeldNavigationDirection(): -1 | 1 | null {
        const previous = this.uiActions.navigatePreviousHeld();
        const next = this.uiActions.navigateNextHeld();

        if (previous === next) {
            return null;
        }

        return previous ? -1 : 1;
    }

    private resetHoldRepeat(): void {
        this.holdRepeatDirection = null;
        this.holdRepeatTimer = 0;
    }

    private findNextEnabledNavigationIndex(startIndex: number, direction: -1 | 1): number {
        const length = this.menuButtonKeys.length;
        if (length === 0) {
            return -1;
        }

        let index = startIndex;
        if (direction > 0 && index < 0) {
            index = 0;
        } else if (direction < 0 && index >= length) {
            index = length - 1;
        }

        while (index >= 0 && index < length) {
            if (this.isNavigationIndexEnabled(index)) {
                return index;
            }

            index += direction;
        }

        return -1;
    }

    private isNavigationIndexEnabled(index: number): boolean {
        const key = this.menuButtonKeys[index];
        const button = key ? this.getUIElement(key) as UIElement | undefined : undefined;
        return !!button && button.getEnabled();
    }

    private ensureIndexInVisibleWindow(index: number): void {
        const maxStartIndex = Math.max(0, this.menuButtonKeys.length - this.visibleWindowSize);

        if (index < this.visibleWindowStartIndex) {
            this.visibleWindowStartIndex = index;
        } else if (index >= this.visibleWindowStartIndex + this.visibleWindowSize) {
            this.visibleWindowStartIndex = index - this.visibleWindowSize + 1;
        }

        this.visibleWindowStartIndex = Math.max(0, Math.min(this.visibleWindowStartIndex, maxStartIndex));
    }

    private layoutVisibleWindow(): void {
        for (let i = 0; i < this.menuButtonKeys.length; i++) {
            const button = this.getUIElement(this.menuButtonKeys[i]);
            if (!button) {
                continue;
            }

            const windowRow = i - this.visibleWindowStartIndex;
            const isVisible = windowRow >= 0 && windowRow < this.visibleWindowSize;

            button.visible = isVisible;
            button.position.set(
                this.listCenterX,
                this.listTop + this.verticalOffset * windowRow
            );
        }
    }
}
