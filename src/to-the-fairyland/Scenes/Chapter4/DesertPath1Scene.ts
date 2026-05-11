import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Rect from "../../../Wolfie2D/Nodes/Graphics/Rect";
import { GraphicType } from "../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Color from "../../../Wolfie2D/Utils/Color";
import DesertCentipedeController from "../../AI/NPC/NPCController/DesertCentipedeController";
import AudioController from "../../GameSystems/AudioController";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import DesertPondScene from "./DesertPondScene";
import DesertSceneBase from "./DesertSceneBase";

type PathCentipedeColumn = {
    column: number;
    ordinal: number;
    topTile: Vec2;
    bottomTile: Vec2;
    indicatorCenter: Vec2;
    indicatorSize: Vec2;
};

type PendingPathWave = {
    columns: PathCentipedeColumn[];
    elapsed: number;
    indicators: Rect[];
};

type ActivePathAttack = {
    controller: DesertCentipedeController;
    direction: Vec2;
    cleanupY: number;
};

export default class DesertPath1Scene extends DesertSceneBase {
    protected readonly tilemap = {
        key: "desertPath1",
        path: "/assets/tilemaps/Chapter4/DesertPath1.json"
    };

    private readonly centipedeTopObjectName = "CentipedeTop";
    private readonly centipedeBottomObjectName = "CentipedeBottom";
    private readonly pathCentipedeIndicatorLayerName = "PathCentipedeIndicators";
    private readonly pathWaveWarningSeconds = 1;
    private readonly pathWaveRestSeconds = 2.35;
    private readonly pathInitialWaveDelaySeconds = 0.8;
    private readonly pathCentipedeBodySegments = 18;
    private readonly pathCentipedeSpeed = 560;
    private readonly pathCentipedeCleanupPadding = 128;
    private readonly pathIndicatorAlpha = 0.62;

    private pathColumns: PathCentipedeColumn[] = [];
    private pendingPathWave: PendingPathWave | null = null;
    private activePathAttacks: ActivePathAttack[] = [];
    private pathWaveTimer = 0;
    private nextWaveUsesOddColumns = true;
    private pondTransitionStarted = false;
    private readonly storyManager = StoryManager.getInstance();

    public override startScene(): void {
        this.resetPathCentipedeState();
        super.startScene();
        this.pathWaveTimer = this.pathInitialWaveDelaySeconds;
        AudioController.getInstance().playSound(this.assets.sounds.centipedesTunnelingSFX.key, true, true);
    }

    public override unloadScene(): void {
        this.clearPendingPathWave();
        this.destroyActivePathAttacks();
        super.unloadScene();
    }

    protected override configureLayers(): void {
        super.configureLayers();
        this.addLayer(
            this.pathCentipedeIndicatorLayerName,
            this.actorLayerDepth + this.centipedeLayerDepthOffset - 1
        );
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);

        const enemySpawnLayer = tilemapData.layers.find(layer => layer.name === this.enemySpawnLayerName);
        const topObject = enemySpawnLayer?.objects.find(obj => obj.name === this.centipedeTopObjectName);
        const bottomObject = enemySpawnLayer?.objects.find(obj => obj.name === this.centipedeBottomObjectName);

        this.pathColumns = topObject && bottomObject
            ? this.buildPathCentipedeColumns(topObject, bottomObject)
            : [];
    }

    protected override updateGameplay(deltaT: number): void {
        super.updateGameplay(deltaT);
        this.updatePathCentipedeWaves(deltaT);
    }

    public override render(): void {
        super.render();

        if (!this.showCentipedeHurtDebug) {
            return;
        }

        const viewScale = this.getViewScale();
        for (const attack of this.activePathAttacks) {
            this.renderCentipedeHurtDebug(attack.controller, viewScale);
        }
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToPond") {
            this.gotoDesertPond();
        }
    }

    private updatePathCentipedeWaves(deltaT: number): void {
        this.updateActivePathAttacks(deltaT);

        if (this.pathColumns.length === 0 || this.transitioning) {
            return;
        }

        if (this.pendingPathWave) {
            this.updatePendingPathWave(deltaT);
            return;
        }

        this.pathWaveTimer -= deltaT;
        if (this.pathWaveTimer <= 0) {
            this.beginNextPathWaveWarning();
        }
    }

    private updatePendingPathWave(deltaT: number): void {
        if (!this.pendingPathWave) {
            return;
        }

        this.pendingPathWave.elapsed += deltaT;
        const progress = Math.max(0, Math.min(1, this.pendingPathWave.elapsed / this.pathWaveWarningSeconds));
        const flash = 0.35 + Math.abs(Math.sin(progress * Math.PI * 6)) * 0.65;

        for (const indicator of this.pendingPathWave.indicators) {
            indicator.color.a = this.pathIndicatorAlpha * flash;
        }

        if (this.pendingPathWave.elapsed < this.pathWaveWarningSeconds) {
            return;
        }

        this.releasePendingPathWave();
    }

    private updateActivePathAttacks(deltaT: number): void {
        if (this.activePathAttacks.length === 0) {
            return;
        }

        const remainingAttacks: ActivePathAttack[] = [];
        let playerDamaged = false;

        for (const attack of this.activePathAttacks) {
            attack.controller.updateStraight(deltaT, attack.direction, this.pathCentipedeSpeed);

            if (!playerDamaged) {
                playerDamaged = this.damagePlayerIfCentipedeOverlaps(attack.controller);
            }

            if (this.isPathAttackPastCleanup(attack)) {
                attack.controller.destroy();
                continue;
            }

            remainingAttacks.push(attack);
        }

        this.activePathAttacks = remainingAttacks;
    }

    private beginNextPathWaveWarning(): void {
        const waveColumns = this.pathColumns.filter(column =>
            this.isOddColumn(column) === this.nextWaveUsesOddColumns
        );

        if (waveColumns.length === 0) {
            this.nextWaveUsesOddColumns = !this.nextWaveUsesOddColumns;
            this.pathWaveTimer = this.pathWaveRestSeconds;
            return;
        }

        this.pendingPathWave = {
            columns: waveColumns,
            elapsed: 0,
            indicators: waveColumns.map(column => this.createPathColumnIndicator(column))
        };
        this.nextWaveUsesOddColumns = !this.nextWaveUsesOddColumns;
    }

    private releasePendingPathWave(): void {
        if (!this.pendingPathWave) {
            return;
        }

        const columns = this.pendingPathWave.columns;
        this.clearPendingPathWave();

        for (const column of columns) {
            this.spawnPathCentipedeAttack(column);
        }

        this.cameraController.shake(450, 38);
        AudioController.getInstance().playSFX(this.assets.sounds.centipedesUnburrowingSFX.key);
        this.pathWaveTimer = this.pathWaveRestSeconds;
    }

    private spawnPathCentipedeAttack(column: PathCentipedeColumn): void {
        const startsAtTop = this.isOddColumn(column);
        const startTile = startsAtTop ? column.topTile : column.bottomTile;
        const endTile = startsAtTop ? column.bottomTile : column.topTile;
        const direction = startsAtTop ? Vec2.DOWN : Vec2.UP;
        const controller = this.createDesertCentipedeAtTile(startTile, {
            facing: startsAtTop ? "down" : "up",
            bodySegments: this.pathCentipedeBodySegments,
            uniform: true,
            moveSpeed: this.pathCentipedeSpeed,
            chargeMoveSpeed: this.pathCentipedeSpeed,
            playSpawnEffects: false
        });
        const endY = this.ground.getTileCenter(endTile.x, endTile.y).y;

        this.activePathAttacks.push({
            controller,
            direction: direction.clone(),
            cleanupY: endY + direction.y * this.pathCentipedeCleanupPadding
        });
    }

    private buildPathCentipedeColumns(topObject: TiledObject, bottomObject: TiledObject): PathCentipedeColumn[] {
        const topTiles = this.getTilesCoveredByObject(topObject);
        const bottomTilesByColumn = new Map<number, Vec2>();

        for (const tile of this.getTilesCoveredByObject(bottomObject)) {
            bottomTilesByColumn.set(tile.x, tile);
        }

        const columnTop = Math.min(topObject.y, bottomObject.y);
        const columnBottom = Math.max(topObject.y + topObject.height, bottomObject.y + bottomObject.height);
        const indicatorHeight = columnBottom - columnTop;
        const tileSize = this.ground.getScaledTileSize();
        const columns: PathCentipedeColumn[] = [];

        for (const topTile of topTiles) {
            const bottomTile = bottomTilesByColumn.get(topTile.x);
            if (!bottomTile) {
                continue;
            }

            columns.push({
                column: topTile.x,
                ordinal: 0,
                topTile: topTile.clone(),
                bottomTile: bottomTile.clone(),
                indicatorCenter: new Vec2(
                    this.ground.getTileCenter(topTile.x, topTile.y).x,
                    columnTop + indicatorHeight / 2
                ),
                indicatorSize: new Vec2(tileSize.x, indicatorHeight)
            });
        }

        return columns
            .sort((a, b) => a.column - b.column)
            .map((column, index) => ({
                ...column,
                ordinal: index + 1
            }));
    }

    private createPathColumnIndicator(column: PathCentipedeColumn): Rect {
        const indicator = this.add.graphic(GraphicType.RECT, this.pathCentipedeIndicatorLayerName, {
            position: column.indicatorCenter.clone(),
            size: column.indicatorSize.clone()
        }) as Rect;

        indicator.color = new Color(190, 0, 0, this.pathIndicatorAlpha);
        indicator.setBorderColor(new Color(255, 35, 35, 0.92));
        indicator.setBorderWidth(2);
        indicator.setSortTile(new Vec2(column.column, 0));
        indicator.setSortOrder(50);
        return indicator;
    }

    private clearPendingPathWave(): void {
        if (!this.pendingPathWave) {
            return;
        }

        for (const indicator of this.pendingPathWave.indicators) {
            indicator.destroy();
        }

        this.pendingPathWave = null;
    }

    private destroyActivePathAttacks(): void {
        for (const attack of this.activePathAttacks) {
            attack.controller.destroy();
        }

        this.activePathAttacks = [];
    }

    private resetPathCentipedeState(): void {
        this.pathColumns = [];
        this.clearPendingPathWave();
        this.destroyActivePathAttacks();
        this.pathWaveTimer = 0;
        this.nextWaveUsesOddColumns = true;
        this.pondTransitionStarted = false;
    }

    private isPathAttackPastCleanup(attack: ActivePathAttack): boolean {
        const tailY = attack.controller.getTailPosition().y;
        return attack.direction.y > 0
            ? tailY >= attack.cleanupY
            : tailY <= attack.cleanupY;
    }

    private isOddColumn(column: PathCentipedeColumn): boolean {
        return column.ordinal % 2 !== 0;
    }

    private gotoDesertPond(): void {
        if (this.pondTransitionStarted) {
            return;
        }

        this.pondTransitionStarted = true;
        this.transitioning = true;
        if (this.gameSessionManager.getStoryState().chapter4) {
            this.storyManager.chapter4.markCrossedDesertPath();
        }

        this.sceneManager.changeToScene(
            DesertPondScene,
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
}
