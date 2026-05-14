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
import AudioController from "../GameSystems/AudioController";
import { AssetBundle, AssetRef } from "./MappedAdventureScene";

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
    "# To The Fairyland",
    "", 
    "## Game Design and Programming",
    "Yucan Chen",
    "Shai Crespo",
    "",
    "## Art and Animation",
    "Yucan Chen",
    "",
    "## Sound Effects and Music",
    "Shai Crespo",
    "",
    "## Special Thanks",
    "Professor McKenna",
    "TAs",
    "Playtesters",
    "You, the player (Thanks for checking it out!)",
    "",
    "## Made with Wolfie2D"
].join("\n");

export default class CreditsScene extends Scene {
    protected assets: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {},
        sounds: {
            endCreditsMusic: { key: "end-credits-music", path: "/assets/sounds/main-screen-music.ogg" }
        },
        images: {}
    };

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
        this.loadAssets(this.assets);
        
        this.add.registerCustomUIElement(CustomUIElementType.CLICKABLE_OVERLAY, (options?: Record<string, any>) => {
            return new ClickableOverlay(options!.position);
        });
    }
    
    public unloadScene(): void {
        AudioController.getInstance().stopMusic();
    }

    protected assetBundleToKeyArrays(bundle: AssetBundle): {
        tilemaps: ReadonlyArray<AssetRef>;
        spritesheets: ReadonlyArray<AssetRef>;
        sprites: ReadonlyArray<AssetRef>;
        sounds: ReadonlyArray<AssetRef>;
        images: ReadonlyArray<AssetRef>;
    } {
        const tilemaps = Object.values(bundle.tilemaps ?? {});
        const spritesheets = Object.values(bundle.spritesheets ?? {});
        const sprites = Object.values(bundle.sprites ?? {});
        const sounds = Object.values(bundle.sounds ?? {});
        const images = Object.values(bundle.images ?? {});
        return {tilemaps, spritesheets, sprites, sounds, images};
    }
    
    protected loadAssets(assets: AssetBundle): void {
        const { tilemaps, spritesheets, sprites, sounds, images } = this.assetBundleToKeyArrays(assets);

        tilemaps
            .filter(tilemap => !this.resourceManager.getTilemap(tilemap.key))
            .forEach(tilemap => this.load.tilemap(tilemap.key, tilemap.path));
        spritesheets
            .filter(spritesheet => !this.resourceManager.getSpritesheet(spritesheet.key))
            .forEach(spritesheet => this.load.spritesheet(spritesheet.key, spritesheet.path));
        sprites
            .filter(sprite => !this.resourceManager.getImage(sprite.key))
            .forEach(sprite => this.load.image(sprite.key, sprite.path));
        sounds
            .filter(sound => !this.resourceManager.getAudio(sound.key))
            .forEach(sound => this.load.audio(sound.key, sound.path));
        images
            .filter(image => !this.resourceManager.getImage(image.key))
            .forEach(image => this.load.image(image.key, image.path));
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
        
        AudioController.getInstance().playMusic(this.assets.sounds.endCreditsMusic.key, true, true, 3);
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

            const headingMatch = /^(#{1,6})\s*(.*)$/.exec(trimmed);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const headingText = headingMatch[2].trim();

                if (!headingText) {
                    lines.push({ text: "", style: "spacer" });
                    continue;
                }

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
