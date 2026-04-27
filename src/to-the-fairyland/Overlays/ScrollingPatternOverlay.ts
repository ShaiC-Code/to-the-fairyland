import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../Wolfie2D/Scene/Scene";
import OverlayLayer, { OverlayLayerOptions } from "./OverlayLayer";

export type ScrollingPatternOptions = OverlayLayerOptions & {
    imageKey: string;
    speed: number;
    direction: Vec2;
    scale?: number;
    alpha?: number;
};

export default class ScrollingPatternOverlay extends OverlayLayer {
    private tiles: Sprite[] = [];
    private offset = Vec2.ZERO;
    private direction: Vec2;
    private speed: number;
    private imageKey: string;
    private tileScale: number;
    private tileAlpha: number;

    public constructor(
        layerName: string,
        scene: Scene,
        getViewportCenter: () => Vec2,
        getViewportHalfSize: () => Vec2,
        options: ScrollingPatternOptions
    ) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);

        this.imageKey = options.imageKey;
        this.speed = options.speed;
        this.direction = options.direction.normalized();
        this.tileScale = options.scale ?? 1;
        this.tileAlpha = options.alpha ?? 1;

        this.initializeOverlay();
    }

    protected override initializeOverlay(): void {
        this.rebuildTiles();
        this.hide();
    }

    public override update(deltaT: number): void {
        if (!this.getIsVisible()) {
            return;
        }

        this.offset.add(this.direction.scaled(this.speed * deltaT));
        this.layoutTiles();
    }

    private rebuildTiles(): void {
        const sample = this.scene.add.sprite(this.imageKey, this.layerName);
        sample.scale.set(this.tileScale, this.tileScale);
        sample.alpha = this.tileAlpha;

        const tileWidth = sample.size.x * sample.scale.x;
        const tileHeight = sample.size.y * sample.scale.y;
        const viewportSize = this.getViewportHalfSize().clone().scale(2);

        const cols = Math.ceil(viewportSize.x / tileWidth) + 2;
        const rows = Math.ceil(viewportSize.y / tileHeight) + 2;
        const total = cols * rows;

        this.tiles.push(sample);

        while (this.tiles.length < total) {
            const tile = this.scene.add.sprite(this.imageKey, this.layerName);
            tile.scale.set(this.tileScale, this.tileScale);
            tile.alpha = this.tileAlpha;
            this.tiles.push(tile);
        }

        this.layoutTiles();
    }

    private layoutTiles(): void {
        if (this.tiles.length === 0) {
            return;
        }

        const first = this.tiles[0];
        const tileWidth = first.size.x * first.scale.x;
        const tileHeight = first.size.y * first.scale.y;
        const viewportHalfSize = this.getViewportHalfSize();

        const cols = Math.ceil((viewportHalfSize.x * 2) / tileWidth) + 2;

        const wrappedX = this.mod(this.offset.x, tileWidth);
        const wrappedY = this.mod(this.offset.y, tileHeight);

        const startX = -tileWidth / 2 - wrappedX;
        const startY = -tileHeight / 2 - wrappedY;

        for (let i = 0; i < this.tiles.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            this.tiles[i].position.set(
                startX + col * tileWidth,
                startY + row * tileHeight
            );
        }
    }

    private mod(value: number, divisor: number): number {
        return ((value % divisor) + divisor) % divisor;
    }
}