import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../Wolfie2D/Scene/Scene";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";

export type ScrollingPatternWorldOptions = {
    imageKey: string;
    depth: number;
    speed: number;
    direction: Vec2;
    scale?: number;
    alpha?: number;
};

export default class ScrollingPatternWorldLayer {
    private tiles: Sprite[] = [];
    private offset = Vec2.ZERO;
    private visible = false;

    private readonly imageKey: string;
    private readonly speed: number;
    private readonly direction: Vec2;
    private readonly tileScale: number;
    private readonly tileAlpha: number;

    public constructor(
        private readonly layerName: string,
        private readonly scene: Scene,
        private readonly viewport: Viewport,
        options: ScrollingPatternWorldOptions
    ) {
        this.imageKey = options.imageKey;
        this.speed = options.speed;
        this.direction = options.direction.normalized();
        this.tileScale = options.scale ?? 1;
        this.tileAlpha = options.alpha ?? 1;

        this.scene.addLayer(layerName, options.depth);
        this.rebuildTiles();
        this.hide();
    }

    public update(deltaT: number): void {
        if (!this.visible) {
            return;
        }

        this.offset.add(this.direction.scaled(this.speed * deltaT));
        this.wrapOffset();
        this.layoutTiles();
    }

    public show(): void {
        this.visible = true;

        for (const tile of this.tiles) {
            tile.visible = true;
        }

        this.layoutTiles();
    }

    public hide(): void {
        this.visible = false;

        for (const tile of this.tiles) {
            tile.visible = false;
        }
    }

    private rebuildTiles(): void {
        const sample = this.scene.add.sprite(this.imageKey, this.layerName);
        sample.scale.set(this.tileScale, this.tileScale);
        sample.alpha = this.tileAlpha;

        const tileWidth = sample.size.x * sample.scale.x;
        const tileHeight = sample.size.y * sample.scale.y;
        const viewportSize = this.viewport.getHalfSize().clone().scale(2);

        const cols = Math.ceil(viewportSize.x / tileWidth) + 4;
        const rows = Math.ceil(viewportSize.y / tileHeight) + 4;
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

        const center = this.viewport.getCenter();
        const halfSize = this.viewport.getHalfSize();

        const left = center.x - halfSize.x;
        const top = center.y - halfSize.y;

        const firstCol = Math.floor((left - this.offset.x) / tileWidth) - 1;
        const firstRow = Math.floor((top - this.offset.y) / tileHeight) - 1;

        const cols = Math.ceil((halfSize.x * 2) / tileWidth) + 4;

        for (let i = 0; i < this.tiles.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            this.tiles[i].position.set(
                (firstCol + col) * tileWidth + this.offset.x,
                (firstRow + row) * tileHeight + this.offset.y
            );
        }
    }

    private wrapOffset(): void {
        if (this.tiles.length === 0) {
            return;
        }
    
        const first = this.tiles[0];
        const tileWidth = first.size.x * first.scale.x;
        const tileHeight = first.size.y * first.scale.y;
    
        this.offset.x = this.mod(this.offset.x, tileWidth);
        this.offset.y = this.mod(this.offset.y, tileHeight);
    }
    
    private mod(value: number, divisor: number): number {
        return ((value % divisor) + divisor) % divisor;
    }
    
}