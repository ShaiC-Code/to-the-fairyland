import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Color from "../../Wolfie2D/Utils/Color";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Input from "../../Wolfie2D/Input/Input";
import { PlayerInput } from "../AI/Player/PlayerController";
import { CustomUIElementType } from "../UI/CustomUIElements/CustomUIElementTypes";
import ClickableOverlay from "../UI/CustomUIElements/ClickableOverlay";
import MainMenu from "./MainMenu";

type CreditLineStyle = "title" | "section" | "name" | "spacer";

export type CreditsLine = {
    text: string;
    style?: CreditLineStyle;
};

export type CreditsSceneInit = {
    creditsText?: string;
    lines?: ReadonlyArray<CreditsLine>;
};

const CREDITS_TEXT = [
    "# CREDITS",
    "",
    "(Replace this placeholder with your provided credits text)",
].join("\n");

export default class CreditsScene extends Scene {
    private readonly creditsLayerName = "Credits";

    private readonly scrollSpeedPxPerSecond = 70;
    private readonly horizontalPadding = 140;
    private readonly bottomStartPadding = 80;
    private readonly endMargin = 80;

    private lines: ReadonlyArray<CreditsLine> = this.parseCreditsText(CREDITS_TEXT);
    private labels: Label[] = [];

    private background!: Rect;
    private clickOverlay!: ClickableOverlay;

    private exiting = false;

    public override initScene(init: CreditsSceneInit = {}): void {
        if (init.creditsText && init.creditsText.trim().length > 0) {
            this.lines = this.parseCreditsText(init.creditsText);
            return;
        }

        if (init.lines && init.lines.length > 0) {
            this.lines = init.lines;
            return;
        }

        this.lines = this.parseCreditsText(CREDITS_TEXT);
    }

    public loadScene(): void {
        this.add.registerCustomUIElement(CustomUIElementType.CLICKABLE_OVERLAY, (options?: Record<string, any>) => {
            return new ClickableOverlay(options!.position);
        });
    }

    public startScene(): void {
        const viewportHalfSize = this.viewport.getHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.addUILayer(this.creditsLayerName);
        this.getLayer(this.creditsLayerName).setDepth(10000);

        this.background = this.add.graphic(GraphicType.RECT, this.creditsLayerName, {
            position: screenCenter.clone(),
            size: viewportSize
        }) as Rect;
        this.background.color = Color.BLACK;

        this.clickOverlay = this.add.uiElement(CustomUIElementType.CLICKABLE_OVERLAY, this.creditsLayerName, {
            position: screenCenter.clone()
        }) as ClickableOverlay;
        this.clickOverlay.size.set(viewportSize.x, viewportSize.y);
        this.clickOverlay.onClick = () => this.exitToMainMenu();

        this.labels = this.createCreditsLabels(viewportSize);
    }

    public updateScene(deltaT: number): void {
        const viewportHalfSize = this.viewport.getHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.background.position.copy(screenCenter);
        this.background.size.copy(viewportSize);
        this.clickOverlay.position.copy(screenCenter);
        this.clickOverlay.size.copy(viewportSize);

        if (Input.isJustPressed(PlayerInput.INTERACT)) {
            this.exitToMainMenu();
            return;
        }

        const dy = this.scrollSpeedPxPerSecond * deltaT;
        for (const label of this.labels) {
            label.position.y -= dy;
        }

        const lastLabel = this.labels[this.labels.length - 1];
        if (lastLabel && lastLabel.position.y + lastLabel.size.y / 2 < -this.endMargin) {
            this.exitToMainMenu();
        }
    }

    private createCreditsLabels(viewportSize: Vec2): Label[] {
        const centerX = viewportSize.x / 2;
        const labelWidth = Math.max(1, viewportSize.x - this.horizontalPadding * 2);

        let y = viewportSize.y + this.bottomStartPadding;

        const labels: Label[] = [];
        for (const line of this.lines) {
            const style = line.style ?? "name";
            const metrics = this.getLineMetrics(style);

            if (!line.text.trim()) {
                y += metrics.spacingAfter;
                continue;
            }

            const label = this.add.uiElement(UIElementType.LABEL, this.creditsLayerName, {
                position: new Vec2(centerX, y),
                text: line.text
            }) as Label;

            label.size.set(labelWidth, metrics.height);
            label.fontSize = metrics.fontSize;
            label.textColor = Color.WHITE;
            label.backgroundColor = Color.TRANSPARENT;
            label.borderColor = Color.TRANSPARENT;
            label.setHAlign("center");
            label.setVAlign("center");

            labels.push(label);

            y += metrics.height + metrics.spacingAfter;
        }

        return labels;
    }

    private getLineMetrics(style: CreditLineStyle): { fontSize: number; height: number; spacingAfter: number } {
        switch (style) {
            case "title":
                return { fontSize: 72, height: 90, spacingAfter: 48 };
            case "section":
                return { fontSize: 44, height: 56, spacingAfter: 22 };
            case "spacer":
                return { fontSize: 0, height: 0, spacingAfter: 38 };
            case "name":
            default:
                return { fontSize: 30, height: 40, spacingAfter: 12 };
        }
    }

    private parseCreditsText(text: string): CreditsLine[] {
        const rawLines = text.replace(/\r\n?/g, "\n").split("\n");

        const lines: CreditsLine[] = [];
        let firstContentLineSeen = false;

        for (const raw of rawLines) {
            const trimmed = raw.trim();

            if (!trimmed) {
                lines.push({ text: "", style: "spacer" });
                continue;
            }

            const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const headingText = headingMatch[2].trim();

                if (level === 1) {
                    lines.push({ text: headingText, style: "title" });
                    firstContentLineSeen = true;
                    continue;
                }

                lines.push({ text: headingText, style: "section" });
                firstContentLineSeen = true;
                continue;
            }

            const withoutBullet = trimmed.startsWith("- ") ? trimmed.slice(2).trim() : trimmed;
            const isShortAllCaps = /^[A-Z0-9][A-Z0-9\s&'.,:()-]*$/.test(withoutBullet)
                && withoutBullet.replace(/[^A-Z]/g, "").length >= 4
                && withoutBullet.length <= 34;
            const isSectionLike = withoutBullet.endsWith(":") || isShortAllCaps;

            if (!firstContentLineSeen) {
                lines.push({ text: withoutBullet, style: "title" });
                firstContentLineSeen = true;
                continue;
            }

            lines.push({
                text: withoutBullet,
                style: isSectionLike ? "section" : "name"
            });
            firstContentLineSeen = true;
        }

        return this.compactSpacers(lines);
    }

    private compactSpacers(lines: CreditsLine[]): CreditsLine[] {
        const compacted: CreditsLine[] = [];
        let previousWasSpacer = false;

        for (const line of lines) {
            const isSpacer = (line.style ?? "name") === "spacer" || !line.text.trim();

            if (isSpacer) {
                if (!previousWasSpacer) {
                    compacted.push({ text: "", style: "spacer" });
                }
                previousWasSpacer = true;
                continue;
            }

            compacted.push(line);
            previousWasSpacer = false;
        }

        return compacted;
    }

    private exitToMainMenu(): void {
        if (this.exiting) {
            return;
        }

        this.exiting = true;

        this.sceneManager.changeToScene(
            MainMenu,
            undefined,
            undefined,
            {
                useFadeTransition: true,
                fadeOutMs: 500,
                fadeInMs: 500
            }
        );
    }
}
