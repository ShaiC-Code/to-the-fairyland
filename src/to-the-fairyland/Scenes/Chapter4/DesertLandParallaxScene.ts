import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Rect from "../../../Wolfie2D/Nodes/Graphics/Rect";
import { GraphicType } from "../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Label from "../../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import { TiledLayerData, TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Color from "../../../Wolfie2D/Utils/Color";
import PlayerAI from "../../AI/Player/PlayerAI";
import { dialogue } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import DesertSceneBase from "./DesertSceneBase";
import DesertPath1Scene from "./DesertPath1Scene";
import AudioController from "../../GameSystems/AudioController";

type CentipedeSpawnMilestone = {
    threshold: number;
    count: number;
    bodySegments: number;
    scriptedSpawn?: CentipedeScriptedSpawn;
};

type CentipedeScriptedSpawn = {
    tilesAhead: number;
    xGapTiles: number;
    dialogueLines: string[];
};

type PendingCentipedeSpawn = {
    tile: Vec2;
    bodySegments: number;
    facing: string;
    elapsed: number;
    duration: number | null;
    indicator: Rect;
};

export default class DesertLandParallaxScene extends DesertSceneBase {
    private static baseTilemapData: TiledTilemapData | null = null;

    protected readonly tilemap = {
        key: "desertLandParallax",
        path: "/assets/tilemaps/Chapter4/DesertLandParallax.json"
    };

    private readonly journeyTilemapRepeatCount = 10;
    private readonly journeyProgressLayerName = "JourneyProgressHUD";
    private readonly progressBarWidth = 360;
    private readonly progressBarHeight = 18;
    private readonly progressBarTop = 44;
    private readonly progressBarFillHeight = 10;
    private readonly fireRockLayerName = "FireRock";
    private readonly rockLayerName = "RockBlockages";
    private readonly randomRockCount = 45;
    private readonly randomRockPlacementAttempts = 2000;
    private readonly rockScale = 1;
    private readonly rockMaxPerRow = 2;
    private readonly rockEdgePaddingRows = 3;
    private readonly rockSafeDistanceFromPlayerTiles = 4;
    private readonly centipedeSpawnIndicatorLayerName = "CentipedeSpawnIndicators";
    private readonly centipedeSpawnIndicatorDuration = 1;
    private readonly centipedeSpawnIndicatorAlpha = 0.65;
    private readonly centipedeSpawnMinPlayerDistanceTiles = 3;
    private readonly centipedeSpawnTopViewRatio = 0.6;
    private readonly centipedeSpawnMilestones: readonly CentipedeSpawnMilestone[] = [
        {
            threshold: 0.10,
            count: 2,
            bodySegments: 20,
            scriptedSpawn: {
                tilesAhead: 7,
                xGapTiles: 7,
                dialogueLines: [
                    "The sand begins to shake beneath your feet...",
                    "<red>Something massive is tunneling under the dunes."
                ]
            }
        },
        { threshold: 0.3, count: 1, bodySegments: 20 },
        { threshold: 0.5, count: 1, bodySegments: 100 },
    ];

    private journeyEndRow = 0;
    private journeyStartRow = 0;
    private journeyBoundsReady = false;
    private journeyProgress = 0;
    private journeyComplete = false;
    private readonly triggeredCentipedeSpawnThresholds = new Set<number>();
    private pendingCentipedeSpawns: PendingCentipedeSpawn[] = [];
    private readonly storyManager = StoryManager.getInstance();

    private progressBack!: Rect;
    private progressFill!: Rect;
    private progressLabel!: Label;

    public override startScene(): void {
        this.triggeredCentipedeSpawnThresholds.clear();
        this.pendingCentipedeSpawns = [];
        this.journeyComplete = false;
        this.applyRepeatedJourneyTilemap();
        super.startScene();
        this.collision.visible = false;
        this.initializeJourneyBounds();
        this.spawnRandomRocks();
        this.initializeJourneyProgressUI();
        this.updateJourneyProgress();
        this.updateJourneyProgressUI();
    }

    protected override configureLayers(): void {
        super.configureLayers();
        this.getLayer(this.groundLayerName).setDepth(2);
        this.getLayer(this.fireRockLayerName).setDepth(3);
        this.addLayer(this.rockLayerName, this.actorLayerDepth);
        this.addLayer(
            this.centipedeSpawnIndicatorLayerName,
            this.actorLayerDepth + this.centipedeLayerDepthOffset - 1
        );
        this.addUILayer(this.journeyProgressLayerName).setDepth(10000);
    }

    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.updateJourneyProgress();
        this.updateJourneyProgressUI();
        this.tryCompleteJourney();
        if (this.journeyComplete) {
            return;
        }

        this.updateCentipedeSpawnMilestones();
        this.updatePendingCentipedeSpawns(deltaT);
    }

    protected override canPlayerMoveToTile(_currentTile: Vec2, direction: Vec2, nextTile: Vec2): boolean {
        if (!this.journeyBoundsReady) {
            return true;
        }

        if (direction.y > 0 && nextTile.y > this.journeyStartRow) {
            return false;
        }

        if (direction.y < 0 && nextTile.y < this.journeyEndRow) {
            return false;
        }

        return true;
    }

    private applyRepeatedJourneyTilemap(): void {
        const tilemapData = this.resourceManager.getTilemap(this.tilemap.key) as TiledTilemapData | undefined;

        if (!tilemapData) {
            return;
        }

        if (!DesertLandParallaxScene.baseTilemapData) {
            DesertLandParallaxScene.baseTilemapData = this.cloneTilemapData(tilemapData);
        }

        const repeatedData = this.buildRepeatedTilemapData(
            DesertLandParallaxScene.baseTilemapData,
            this.journeyTilemapRepeatCount
        );

        Object.assign(tilemapData, repeatedData);
    }

    private buildRepeatedTilemapData(baseData: TiledTilemapData, repeatCount: number): TiledTilemapData {
        const repeats = Math.max(1, Math.floor(repeatCount));
        const repeatedData = this.cloneTilemapData(baseData);
        const basePixelHeight = baseData.height * baseData.tileheight;

        repeatedData.height = baseData.height * repeats;
        repeatedData.layers = baseData.layers.map(layer =>
            this.buildRepeatedLayer(layer, baseData.height, basePixelHeight, repeats)
        );

        return repeatedData;
    }

    private buildRepeatedLayer(
        layer: TiledLayerData,
        baseTileRows: number,
        basePixelHeight: number,
        repeats: number
    ): TiledLayerData {
        const repeatedLayer = this.cloneLayerData(layer);

        if (layer.type === "tilelayer") {
            repeatedLayer.height = baseTileRows * repeats;
            repeatedLayer.data = [];

            for (let i = 0; i < repeats; i++) {
                repeatedLayer.data.push(...layer.data);
            }

            return repeatedLayer;
        }

        if (layer.type !== "objectgroup") {
            return repeatedLayer;
        }

        if (layer.name === this.spawnLayerName) {
            repeatedLayer.objects = layer.objects.map(obj =>
                this.cloneObjectAtVerticalRepeat(obj, repeats - 1, basePixelHeight)
            );
            return repeatedLayer;
        }

        if (layer.name === this.enemySpawnLayerName) {
            repeatedLayer.objects = [];

            for (let i = 0; i < repeats; i++) {
                repeatedLayer.objects.push(
                    ...layer.objects.map(obj => this.cloneObjectAtVerticalRepeat(obj, i, basePixelHeight))
                );
            }
        }

        return repeatedLayer;
    }

    private cloneObjectAtVerticalRepeat(obj: TiledObject, repeatIndex: number, basePixelHeight: number): TiledObject {
        const repeatedObject = this.cloneObjectData(obj);
        repeatedObject.y += repeatIndex * basePixelHeight;
        repeatedObject.id += repeatIndex * 10000;
        return repeatedObject;
    }

    private cloneTilemapData(data: TiledTilemapData): TiledTilemapData {
        return JSON.parse(JSON.stringify(data)) as TiledTilemapData;
    }

    private cloneLayerData(layer: TiledLayerData): TiledLayerData {
        return JSON.parse(JSON.stringify(layer)) as TiledLayerData;
    }

    private cloneObjectData(obj: TiledObject): TiledObject {
        return JSON.parse(JSON.stringify(obj)) as TiledObject;
    }

    private initializeJourneyBounds(): void {
        const bounds = this.getJourneyMapBounds();

        this.journeyEndRow = bounds.minRow;
        this.journeyStartRow = bounds.maxRow;
        this.journeyBoundsReady = true;

        const mapBounds = this.getRequiredTilemap(this.mapBoundsLayerName);
        const tileSize = mapBounds.getScaledTileSize();
        const topLeft = mapBounds.getWorldPosition(bounds.minCol, this.journeyEndRow);
        const bottomRight = mapBounds.getWorldPosition(bounds.maxCol, this.journeyStartRow);

        this.viewport.setBounds(
            topLeft.x,
            topLeft.y,
            bottomRight.x + tileSize.x,
            bottomRight.y + tileSize.y
        );
        this.viewport.snapToTarget();
    }

    private getJourneyMapBounds(): { minCol: number; maxCol: number; minRow: number; maxRow: number } {
        const mapBounds = this.getTilemap(this.mapBoundsLayerName) as OrthogonalTilemap | null;

        if (!mapBounds) {
            const dimensions = this.ground.getDimensions();
            return {
                minCol: 0,
                maxCol: dimensions.x - 1,
                minRow: 0,
                maxRow: dimensions.y - 1
            };
        }

        const dimensions = mapBounds.getDimensions();
        let minCol = dimensions.x;
        let maxCol = -1;
        let minRow = dimensions.y;
        let maxRow = -1;

        for (let row = 0; row < dimensions.y; row++) {
            for (let col = 0; col < dimensions.x; col++) {
                if (mapBounds.getTile(col, row) === 0) {
                    continue;
                }

                minCol = Math.min(minCol, col);
                maxCol = Math.max(maxCol, col);
                minRow = Math.min(minRow, row);
                maxRow = Math.max(maxRow, row);
            }
        }

        if (maxCol < 0 || maxRow < 0) {
            return {
                minCol: 0,
                maxCol: dimensions.x - 1,
                minRow: 0,
                maxRow: dimensions.y - 1
            };
        }

        return { minCol, maxCol, minRow, maxRow };
    }

    private initializeJourneyProgressUI(): void {
        const center = this.getProgressBarCenter();

        this.progressBack = this.add.graphic(GraphicType.RECT, this.journeyProgressLayerName, {
            position: center,
            size: new Vec2(this.progressBarWidth, this.progressBarHeight)
        }) as Rect;
        this.progressBack.color = new Color(0, 0, 0, 0.65);
        this.progressBack.setBorderColor(new Color(255, 255, 255, 0.85));
        this.progressBack.setBorderWidth(2);

        this.progressFill = this.add.graphic(GraphicType.RECT, this.journeyProgressLayerName, {
            position: center.clone(),
            size: new Vec2(1, this.progressBarFillHeight)
        }) as Rect;
        this.progressFill.color = new Color(240, 196, 75, 0.95);

        this.progressLabel = this.add.uiElement(UIElementType.LABEL, this.journeyProgressLayerName, {
            position: new Vec2(center.x, center.y - 25),
            text: "Final Journey 0%"
        }) as Label;
        this.progressLabel.size.set(this.progressBarWidth, 24);
        this.progressLabel.fontSize = 20;
        this.progressLabel.textColor = Color.WHITE;
        this.progressLabel.backgroundColor = Color.TRANSPARENT;
        this.progressLabel.borderColor = Color.TRANSPARENT;
    }

    private updateJourneyProgress(): void {
        if (!this.journeyBoundsReady) {
            this.journeyProgress = 0;
            return;
        }

        const totalRows = Math.max(1, this.journeyStartRow - this.journeyEndRow);
        const ai = this.player.ai as PlayerAI;
        const startRow = ai.currentTile.y;
        const endRow = ai.targetTile?.y ?? startRow;
        const currentRow = ai.moving
            ? startRow + (endRow - startRow) * ai.moveProgress
            : startRow;

        this.journeyProgress = Math.max(0, Math.min(
            1,
            (this.journeyStartRow - currentRow) / totalRows
        ));
    }

    private updateJourneyProgressUI(): void {
        const center = this.getProgressBarCenter();
        const progressWidth = Math.max(1, this.progressBarWidth * this.journeyProgress);
        const left = center.x - this.progressBarWidth / 2;

        this.progressBack.position.copy(center);
        this.progressFill.position.set(left + progressWidth / 2, center.y);
        this.progressFill.size.set(progressWidth, this.progressBarFillHeight);
        this.progressLabel.position.set(center.x, center.y - 25);
        this.progressLabel.text = `Final Journey ${Math.round(this.journeyProgress * 100)}%`;
    }

    private tryCompleteJourney(): void {
        if (this.journeyComplete || this.journeyProgress < 1 || this.dialogueController.isActive) {
            return;
        }

        this.journeyComplete = true;
        this.transitioning = true;

        if (this.gameSessionManager.getStoryState().chapter4) {
            this.storyManager.chapter4.markEscapedCentipedes();
        }

        this.sceneManager.changeToScene(
            DesertPath1Scene,
            {
                cheatsEnabled: this.cheatsEnabled,
                spawnName: "RoadStart"
            },
            undefined,
            {
                showLoadingOverlay: true,
                useFadeTransition: true,
                fadeOutMs: 500,
                fadeInMs: 500
            }
        );
    }

    private spawnRandomRocks(): void {
        const blockingCollisionTileId = this.getBlockingCollisionTileId();
        const rowRockCounts = new Map<number, number>();
        let spawned = 0;
        let attempts = 0;

        while (spawned < this.randomRockCount && attempts < this.randomRockPlacementAttempts) {
            attempts += 1;

            const tile = this.getRandomRockCandidateTile();

            if (!this.canPlaceRockAtTile(tile, rowRockCounts)) {
                continue;
            }

            this.spawnRockAtTile(tile, blockingCollisionTileId);
            rowRockCounts.set(tile.y, (rowRockCounts.get(tile.y) ?? 0) + 1);
            spawned += 1;
        }
    }

    private getRandomRockCandidateTile(): Vec2 {
        const dimensions = this.ground.getDimensions();
        const minRow = Math.min(
            this.journeyStartRow,
            this.journeyEndRow + this.rockEdgePaddingRows
        );
        const maxRow = Math.max(
            minRow,
            this.journeyStartRow - this.rockEdgePaddingRows
        );

        return new Vec2(
            Math.floor(Math.random() * dimensions.x),
            minRow + Math.floor(Math.random() * (maxRow - minRow + 1))
        );
    }

    private canPlaceRockAtTile(tile: Vec2, rowRockCounts: Map<number, number>): boolean {
        if ((rowRockCounts.get(tile.y) ?? 0) >= this.rockMaxPerRow) {
            return false;
        }

        if (!this.isRockSurfaceTile(tile)) {
            return false;
        }

        if (this.collision.getTile(tile.x, tile.y) !== 0) {
            return false;
        }

        const playerTile = (this.player.ai as PlayerAI).currentTile;
        const distanceFromPlayer = Math.abs(tile.x - playerTile.x) + Math.abs(tile.y - playerTile.y);

        return distanceFromPlayer >= this.rockSafeDistanceFromPlayerTiles;
    }

    private isRockSurfaceTile(tile: Vec2): boolean {
        if (this.ground.getTile(tile.x, tile.y) > 0) {
            return true;
        }

        const fireRock = this.getTilemap(this.fireRockLayerName) as OrthogonalTilemap | null;
        return (fireRock?.getTile(tile.x, tile.y) ?? 0) > 0;
    }

    private spawnRockAtTile(tile: Vec2, blockingCollisionTileId: number): void {
        const rock = this.add.sprite(this.assets.sprites.rockSprite.key, this.rockLayerName);

        rock.position.copy(this.ground.getTileCenter(tile.x, tile.y));
        rock.scale.set(this.rockScale, this.rockScale);
        rock.setSortTile(tile.clone());
        rock.setSortOrder(1);

        this.collision.setTile(tile.x, tile.y, blockingCollisionTileId);
    }

    private getBlockingCollisionTileId(): number {
        const existingCollisionTileId = this.getFirstNonEmptyTileId(this.collision);

        if (existingCollisionTileId !== 0) {
            return existingCollisionTileId;
        }

        const mapBounds = this.getTilemap(this.mapBoundsLayerName) as OrthogonalTilemap | null;
        const mapBoundsTileId = mapBounds ? this.getFirstNonEmptyTileId(mapBounds) : 0;

        return mapBoundsTileId !== 0 ? mapBoundsTileId : 1;
    }

    private getFirstNonEmptyTileId(tilemap: OrthogonalTilemap): number {
        const dimensions = tilemap.getDimensions();

        for (let row = 0; row < dimensions.y; row++) {
            for (let col = 0; col < dimensions.x; col++) {
                const tile = tilemap.getTile(col, row);

                if (tile !== 0) {
                    return tile;
                }
            }
        }

        return 0;
    }

    private updateCentipedeSpawnMilestones(): void {
        for (const milestone of this.centipedeSpawnMilestones) {
            if (this.triggeredCentipedeSpawnThresholds.has(milestone.threshold)) {
                continue;
            }

            if (this.journeyProgress < milestone.threshold) {
                continue;
            }

            this.triggeredCentipedeSpawnThresholds.add(milestone.threshold);

            if (milestone.scriptedSpawn) {
                this.queueScriptedCentipedeSpawnWave(milestone);
            } else {
                this.queueCentipedeSpawnWave(milestone.count, milestone.bodySegments);
            }
        }
    }

    private queueCentipedeSpawnWave(count: number, bodySegments: number): void {
        const reservedTiles: Vec2[] = [];

        for (let i = 0; i < count; i++) {
            const spawnTile = this.getRandomVisibleCentipedeSpawnTile(reservedTiles);
            reservedTiles.push(spawnTile);
            this.queueCentipedeSpawn(spawnTile, bodySegments);
        }
    }

    private queueScriptedCentipedeSpawnWave(milestone: CentipedeSpawnMilestone): void {
        const scriptedSpawn = milestone.scriptedSpawn;
        if (!scriptedSpawn) {
            return;
        }

        const spawnTiles = this.getCentipedeSpawnTilesAheadOfPlayer(
            scriptedSpawn.tilesAhead,
            milestone.count,
            scriptedSpawn.xGapTiles
        );
        const queuedSpawns = spawnTiles.map(tile =>
            this.queueCentipedeSpawn(tile, milestone.bodySegments, null)
        );

        this.startDialogue(dialogue(
            scriptedSpawn.dialogueLines,
            { onComplete: () => this.releaseCentipedeSpawns(queuedSpawns) }
        ));
        AudioController.getInstance().playSound(this.assets.sounds.centipedesTunnelingSFX.key, true, true);
    }

    private queueCentipedeSpawn(
        tile: Vec2,
        bodySegments: number,
        duration: number | null = this.centipedeSpawnIndicatorDuration
    ): PendingCentipedeSpawn {
        const tileSize = this.ground.getScaledTileSize();
        const indicator = this.add.graphic(GraphicType.RECT, this.centipedeSpawnIndicatorLayerName, {
            position: this.ground.getTileCenter(tile.x, tile.y),
            size: tileSize.clone()
        }) as Rect;

        indicator.color = new Color(190, 0, 0, this.centipedeSpawnIndicatorAlpha);
        indicator.setBorderColor(new Color(255, 40, 40, 0.9));
        indicator.setBorderWidth(2);
        indicator.setSortTile(tile.clone());
        indicator.setSortOrder(50);

        const pendingSpawn = {
            tile,
            bodySegments,
            facing: this.getFacingFromTileTowardPlayer(tile),
            elapsed: 0,
            duration,
            indicator
        };

        this.pendingCentipedeSpawns.push(pendingSpawn);
        return pendingSpawn;
    }

    private updatePendingCentipedeSpawns(deltaT: number): void {
        if (this.pendingCentipedeSpawns.length === 0) {
            return;
        }

        const readySpawns: PendingCentipedeSpawn[] = [];
        const waitingSpawns: PendingCentipedeSpawn[] = [];

        for (const spawn of this.pendingCentipedeSpawns) {
            spawn.elapsed += deltaT;

            if (spawn.duration !== null && spawn.elapsed >= spawn.duration) {
                readySpawns.push(spawn);
                continue;
            }

            const progress = spawn.duration === null
                ? spawn.elapsed
                : Math.max(0, Math.min(1, spawn.elapsed / spawn.duration));
            const flash = 0.35 + Math.abs(Math.sin(progress * Math.PI * 6)) * 0.65;
            spawn.indicator.color.a = this.centipedeSpawnIndicatorAlpha * flash;
            waitingSpawns.push(spawn);
        }

        this.pendingCentipedeSpawns = waitingSpawns;

        for (const spawn of readySpawns) {
            spawn.indicator.destroy();
            this.spawnDesertCentipedeAtTile(spawn.tile, {
                bodySegments: spawn.bodySegments,
                facing: spawn.facing
            });
        }
    }

    private releaseCentipedeSpawns(spawns: PendingCentipedeSpawn[]): void {
        const spawnSet = new Set(spawns);
        this.pendingCentipedeSpawns = this.pendingCentipedeSpawns.filter(
            spawn => !spawnSet.has(spawn)
        );

        for (const spawn of spawns) {
            spawn.indicator.destroy();
            this.spawnDesertCentipedeAtTile(spawn.tile, {
                bodySegments: spawn.bodySegments,
                facing: spawn.facing
            });
        }
    }

    private getCentipedeSpawnTilesAheadOfPlayer(
        tilesAhead: number,
        count: number,
        xGapTiles: number
    ): Vec2[] {
        const playerTile = (this.player.ai as PlayerAI).currentTile;
        const spawnCount = Math.max(1, Math.floor(count));
        const gap = Math.max(1, Math.floor(xGapTiles));
        const ahead = Math.max(0, Math.floor(tilesAhead));
        const spawnRow = Math.max(
            this.journeyEndRow,
            Math.min(this.journeyStartRow, playerTile.y - ahead)
        );
        const firstCol = playerTile.x - Math.floor((spawnCount - 1) * gap / 2);
        const reservedTiles: Vec2[] = [];
        const spawnTiles: Vec2[] = [];

        for (let i = 0; i < spawnCount; i++) {
            const desiredCol = firstCol + i * gap;
            const spawnTile = this.getNearestValidCentipedeSpawnTileOnRow(
                spawnRow,
                desiredCol,
                reservedTiles
            );

            reservedTiles.push(spawnTile);
            spawnTiles.push(spawnTile);
        }

        return spawnTiles;
    }

    private getNearestValidCentipedeSpawnTileOnRow(row: number, desiredCol: number, reservedTiles: Vec2[]): Vec2 {
        const dimensions = this.ground.getDimensions();
        const clampedCol = Math.max(0, Math.min(dimensions.x - 1, Math.round(desiredCol)));

        for (let offset = 0; offset < dimensions.x; offset++) {
            const candidateCols = offset === 0
                ? [clampedCol]
                : [clampedCol - offset, clampedCol + offset];

            for (const col of candidateCols) {
                if (col < 0 || col >= dimensions.x) {
                    continue;
                }

                const tile = new Vec2(col, row);
                if (this.isValidCentipedeSpawnTile(tile, reservedTiles, false)) {
                    return tile;
                }
            }
        }

        return new Vec2(clampedCol, row);
    }

    private getRandomVisibleCentipedeSpawnTile(reservedTiles: Vec2[]): Vec2 {
        const topDistantTiles = this.getVisibleCentipedeSpawnTiles(reservedTiles, true, true);
        const topTiles = topDistantTiles.length > 0
            ? topDistantTiles
            : this.getVisibleCentipedeSpawnTiles(reservedTiles, false, true);
        const visibleDistantTiles = topTiles.length > 0
            ? topTiles
            : this.getVisibleCentipedeSpawnTiles(reservedTiles, true, false);
        const tiles = visibleDistantTiles.length > 0
            ? visibleDistantTiles
            : this.getVisibleCentipedeSpawnTiles(reservedTiles, false, false);

        if (tiles.length === 0) {
            return (this.player.ai as PlayerAI).currentTile.clone();
        }

        return tiles[Math.floor(Math.random() * tiles.length)];
    }

    private getVisibleCentipedeSpawnTiles(
        reservedTiles: Vec2[],
        respectPlayerDistance: boolean,
        topViewOnly: boolean
    ): Vec2[] {
        const view = this.viewport.getView();
        const viewBottom = topViewOnly
            ? view.top + (view.bottom - view.top) * this.centipedeSpawnTopViewRatio
            : view.bottom;
        const topLeftTile = this.ground.getTilemapPosition(view.left, view.top);
        const bottomRightTile = this.ground.getTilemapPosition(view.right - 1, viewBottom - 1);
        const dimensions = this.ground.getDimensions();
        const minCol = Math.max(0, Math.min(topLeftTile.x, bottomRightTile.x));
        const maxCol = Math.min(dimensions.x - 1, Math.max(topLeftTile.x, bottomRightTile.x));
        const minRow = Math.max(this.journeyEndRow, Math.min(topLeftTile.y, bottomRightTile.y));
        const maxRow = Math.min(this.journeyStartRow, Math.max(topLeftTile.y, bottomRightTile.y));
        const tiles: Vec2[] = [];

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                const tile = new Vec2(col, row);

                if (!this.isValidCentipedeSpawnTile(tile, reservedTiles, respectPlayerDistance)) {
                    continue;
                }

                tiles.push(tile);
            }
        }

        return tiles;
    }

    private isValidCentipedeSpawnTile(
        tile: Vec2,
        reservedTiles: Vec2[],
        respectPlayerDistance: boolean
    ): boolean {
        if (this.ground.getTile(tile.x, tile.y) === 0) {
            return false;
        }

        if (this.collision.getTile(tile.x, tile.y) !== 0) {
            return false;
        }

        if (reservedTiles.some(reservedTile => reservedTile.equals(tile))) {
            return false;
        }

        if (this.pendingCentipedeSpawns.some(spawn => spawn.tile.equals(tile))) {
            return false;
        }

        const center = this.ground.getTileCenter(tile.x, tile.y);
        if (!this.viewport.getView().containsPoint(center)) {
            return false;
        }

        if (!respectPlayerDistance) {
            return true;
        }

        const playerTile = (this.player.ai as PlayerAI).currentTile;
        return Math.abs(tile.x - playerTile.x) + Math.abs(tile.y - playerTile.y)
            >= this.centipedeSpawnMinPlayerDistanceTiles;
    }

    private getFacingFromTileTowardPlayer(tile: Vec2): string {
        const playerTile = (this.player.ai as PlayerAI).currentTile;
        const dx = playerTile.x - tile.x;
        const dy = playerTile.y - tile.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx < 0 ? "left" : "right";
        }

        return dy < 0 ? "up" : "down";
    }

    private getProgressBarCenter(): Vec2 {
        const halfSize = this.viewport.getHalfSize();
        return new Vec2(halfSize.x, this.progressBarTop);
    }
}
