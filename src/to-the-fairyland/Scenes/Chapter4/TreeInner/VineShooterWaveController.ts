import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import { TiledObject } from "../../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import OrthogonalTilemap from "../../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Rect from "../../../../Wolfie2D/Nodes/Graphics/Rect";
import Line from "../../../../Wolfie2D/Nodes/Graphics/Line";
import { GraphicType } from "../../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Color from "../../../../Wolfie2D/Utils/Color";
import Scene from "../../../../Wolfie2D/Scene/Scene";
import PlayerAI from "../../../AI/Player/PlayerAI";
import { VineAttackOptions } from "./VineAttackController";

export const VINE_INDICATOR_LAYER_NAME = "VineIndicators";

type VineWavePhase = {
    title?: string;
    titleDuration?: number;
    duration: number;
    endFadeDuration?: number;
    endSpeedMultiplier?: number;
    spawnDelayMin: number;
    spawnDelayMax: number;
    speedMin: number;
    speedMax: number;
};




type VineIndicatorStyle = "tile" | "line";
type VineIndicator = Rect | Line;

type VineIndicatorGroup = {
    indicators: VineIndicator[];
    elapsed: number;
};

type VineShooterWaveControllerOptions = {
    showWaveTitle?: (text: string, duration: number) => Promise<void>;
    scene: Scene;
    ground: OrthogonalTilemap;
    getPlayerAI: () => PlayerAI;
    shouldRun: () => boolean;
    isDialogueActive: () => boolean;
    waitSeconds: (seconds: number) => Promise<void>;
    getTilesCrossedByWorldSegment: (start: Vec2, end: Vec2) => Vec2[];
    startVineAttack: (startObj: TiledObject, endObj: TiledObject, options: VineAttackOptions) => void;
    vineSpriteKey: string;
    indicatorStyle?: VineIndicatorStyle;
    onAllWavesComplete?: () => void;

};

export default class VineShooterWaveController {
    private vineShooterPoints: TiledObject[] = [];
    private activeVineIndicatorGroups: VineIndicatorGroup[] = [];
    private vineWaveActive = false;
    private vineWaveCooldown = 0;

    private readonly scene: Scene;
    private readonly ground: OrthogonalTilemap;
    private readonly getPlayerAI: () => PlayerAI;
    private readonly shouldRun: () => boolean;
    private readonly isDialogueActive: () => boolean;
    private readonly waitSeconds: (seconds: number) => Promise<void>;
    private readonly showWaveTitle?: (text: string, duration: number) => Promise<void>;
    private readonly getTilesCrossedByWorldSegment: (start: Vec2, end: Vec2) => Vec2[];
    private readonly startVineAttack: (startObj: TiledObject, endObj: TiledObject, options: VineAttackOptions) => void;
    private readonly vineSpriteKey: string;

    private readonly indicatorDuration = 0.35;
    private readonly indicatorStyle: VineIndicatorStyle;
    private readonly indicatorAlpha = 0.55;
    private readonly indicatorLineThickness = 9;
    private readonly onAllWavesComplete?: () => void;


    private readonly wavePhases: VineWavePhase[] = [
        {
            title: "THE VINES STARTED MOVING",
            titleDuration: 1,
            duration: 15,
            endFadeDuration: 2.5,
            endSpeedMultiplier: 0.35,
            spawnDelayMin: 0.45,
            spawnDelayMax: 0.8,
            speedMin: 300,
            speedMax: 480
        },
        {
            title: "THE TREE HAS GONE MAD!!!",
            titleDuration: 1,
            duration: 25,
            endFadeDuration: 4,
            endSpeedMultiplier: 0.35,
            spawnDelayMin: 0.12,
            spawnDelayMax: 0.28,
            speedMin: 520,
            speedMax: 800
        },
        {
            title: "THE TREE IS WEAKENING...",
            titleDuration: 1,
            duration: 12,
            endFadeDuration: 2,
            endSpeedMultiplier: 0.35,
            spawnDelayMin: 0.5,
            spawnDelayMax: 0.9,
            speedMin: 120,
            speedMax: 180
        }
    ];
    

    private readonly waveCooldownMin = 2.5;
    private readonly waveCooldownMax = 4.5;

    public constructor(options: VineShooterWaveControllerOptions) {
        this.scene = options.scene;
        this.ground = options.ground;
        this.getPlayerAI = options.getPlayerAI;
        this.shouldRun = options.shouldRun;
        this.isDialogueActive = options.isDialogueActive;
        this.waitSeconds = options.waitSeconds;
        this.showWaveTitle = options.showWaveTitle;
        this.getTilesCrossedByWorldSegment = options.getTilesCrossedByWorldSegment;
        this.startVineAttack = options.startVineAttack;
        this.vineSpriteKey = options.vineSpriteKey;
        this.indicatorStyle = options.indicatorStyle ?? "line";
        this.onAllWavesComplete = options.onAllWavesComplete;

    }

    public setVineShooterPoints(points: TiledObject[]): void {
        this.vineShooterPoints = points;
    }

    public setCooldown(seconds: number): void {
        this.vineWaveCooldown = seconds;
    }

    public getInitialCooldown(): number {
        return this.waveCooldownMin;
    }

    public update(deltaT: number): void {
        this.updateIndicators(deltaT);

        if (!this.shouldRun()) {
            this.vineWaveCooldown = 0;
            return;
        }

        if (this.isDialogueActive()) {
            return;
        }

        if (this.vineWaveActive) {
            return;
        }

        this.vineWaveCooldown -= deltaT;

        if (this.vineWaveCooldown > 0) {
            return;
        }

        this.startNormalVineWave();
    }

    private async startNormalVineWave(): Promise<void> {
        if (this.vineWaveActive) {
            return;
        }
    
        this.vineWaveActive = true;
    
        for (const phase of this.wavePhases) {
            if (phase.title && this.showWaveTitle) {
                await this.showWaveTitle(phase.title, phase.titleDuration ?? 1);
    
                if (!this.shouldRun() || this.isDialogueActive()) {
                    this.vineWaveActive = false;
                    return;
                }
            }
    
            let elapsed = 0;
    
            while (elapsed < phase.duration) {
                if (!this.shouldRun()) {
                    this.vineWaveActive = false;
                    return;
                }

                const fadeT = this.getPhaseEndFadeT(phase, elapsed);
                const speedMultiplier = this.lerp(
                    1,
                    phase.endSpeedMultiplier ?? 0.35,
                    fadeT
                );
            
                this.tryStartNormalVineShooterAttackWithSpeed(
                    this.randomBetween(phase.speedMin, phase.speedMax) * speedMultiplier
                );
            
                const delay = Math.min(
                    this.randomBetween(phase.spawnDelayMin, phase.spawnDelayMax),
                    phase.duration - elapsed
                );
            
                await this.waitSeconds(delay);
                elapsed += delay;
            }
        }
    
        this.vineWaveActive = false;
        this.onAllWavesComplete?.();
    }

    private tryStartNormalVineShooterAttackWithSpeed(speed: number): void {
        const startObj = this.getRandomVineShooterPoint();

        if (!startObj) {
            return;
        }

        const endObj = this.findBestVineShooterEndForPlayer(startObj);

        if (!endObj) {
            return;
        }

        this.warnThenStartNormalVineAttack(startObj, endObj, speed);
    }

    private async warnThenStartNormalVineAttack(
        startObj: TiledObject,
        endObj: TiledObject,
        speed: number
    ): Promise<void> {
        const start = new Vec2(startObj.x, startObj.y);
        const end = new Vec2(endObj.x, endObj.y);
        const crossedTiles = this.getTilesCrossedByWorldSegment(start, end);

        const indicatorGroup = this.showVineAttackIndicators(start, end, crossedTiles);

        await this.waitSeconds(this.indicatorDuration);

        this.clearVineAttackIndicators(indicatorGroup);

        if (!this.shouldRun()) {
            return;
        }

        if (this.isDialogueActive()) {
            return;
        }

        this.startVineAttack(startObj, endObj, {
            type: "normal",
            speed,
            spriteKey: this.vineSpriteKey
        });
    }

    private showVineAttackIndicators(start: Vec2, end: Vec2, tiles: Vec2[]): VineIndicatorGroup {
        const indicators = this.indicatorStyle === "line"
            ? this.createLineVineAttackIndicators(start, end)
            : this.createTileVineAttackIndicators(tiles);

        const group = {
            indicators,
            elapsed: 0
        };

        this.activeVineIndicatorGroups.push(group);

        return group;
    }

    private createTileVineAttackIndicators(tiles: Vec2[]): VineIndicator[] {
        const indicators: VineIndicator[] = [];
        const tileSize = this.ground.getScaledTileSize();

        for (const tile of tiles) {
            const indicator = this.scene.add.graphic(GraphicType.RECT, VINE_INDICATOR_LAYER_NAME, {
                position: this.ground.getTileCenter(tile.x, tile.y),
                size: tileSize.clone()
            }) as Rect;

            indicator.color = new Color(150, 0, 0, this.indicatorAlpha);
            indicator.setSortTile(tile.clone());
            indicator.setSortOrder(20);

            indicators.push(indicator);
        }

        return indicators;
    }

    private createLineVineAttackIndicators(start: Vec2, end: Vec2): VineIndicator[] {
        const indicator = this.scene.add.graphic(GraphicType.LINE, VINE_INDICATOR_LAYER_NAME, {
            start: start.clone(),
            end: end.clone()
        }) as Line;

        indicator.color = new Color(150, 0, 0, this.indicatorAlpha);
        indicator.thickness = this.indicatorLineThickness;
        indicator.setSortTile(this.ground.getTilemapPosition(start.x, start.y));
        indicator.setSortOrder(20);

        return [indicator];
    }

    private updateIndicators(deltaT: number): void {
        if (this.activeVineIndicatorGroups.length === 0) {
            return;
        }

        for (const group of this.activeVineIndicatorGroups) {
            group.elapsed += deltaT;

            const t = Math.min(group.elapsed / this.indicatorDuration, 1);
            const flash = Math.abs(Math.sin(t * Math.PI * 2));
            const alpha = this.indicatorAlpha * flash * (1 - t * 0.35);


            for (const indicator of group.indicators) {
                indicator.color.a = alpha;
            }
        }
    }

    private clearVineAttackIndicators(group: VineIndicatorGroup): void {
        for (const indicator of group.indicators) {
            indicator.destroy();
        }

        this.activeVineIndicatorGroups = this.activeVineIndicatorGroups.filter(
            activeGroup => activeGroup !== group
        );
    }

    private getRandomVineShooterPoint(): TiledObject | undefined {
        if (this.vineShooterPoints.length === 0) {
            return undefined;
        }

        const index = Math.floor(Math.random() * this.vineShooterPoints.length);
        return this.vineShooterPoints[index];
    }

    private findBestVineShooterEndForPlayer(startObj: TiledObject): TiledObject | undefined {
        const start = new Vec2(startObj.x, startObj.y);
        const playerTargetTiles = this.getPlayerVineTargetTiles();
        let bestEnd: TiledObject | undefined;
        let bestDistance = Infinity;

        for (const endObj of this.vineShooterPoints) {
            if (endObj === startObj) {
                continue;
            }

            const end = new Vec2(endObj.x, endObj.y);
            const crossedTiles = this.getTilesCrossedByWorldSegment(start, end);

            if (!this.tilesIncludeAny(crossedTiles, playerTargetTiles)) {
                continue;
            }

            const distance = this.getDistanceFromTilesToWorldSegment(playerTargetTiles, start, end);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestEnd = endObj;
            }
        }

        return bestEnd;
    }

    private getPlayerVineTargetTiles(): Vec2[] {
        const ai = this.getPlayerAI();
        const tiles = [ai.currentTile];

        if (ai.targetTile && !this.sameTile(ai.currentTile, ai.targetTile)) {
            tiles.push(ai.targetTile);
        }

        return tiles;
    }

    private tilesIncludeAny(tiles: Vec2[], targets: Vec2[]): boolean {
        return targets.some(target =>
            tiles.some(tile => this.sameTile(tile, target))
        );
    }

    private getDistanceFromTilesToWorldSegment(tiles: Vec2[], start: Vec2, end: Vec2): number {
        let bestDistance = Infinity;

        for (const tile of tiles) {
            const center = this.ground.getTileCenter(tile.x, tile.y);
            bestDistance = Math.min(
                bestDistance,
                this.getDistanceFromPointToWorldSegment(center, start, end)
            );
        }

        return bestDistance;
    }

    private getDistanceFromPointToWorldSegment(point: Vec2, start: Vec2, end: Vec2): number {
        const segment = start.vecTo(end);
        const segmentLengthSq = segment.x * segment.x + segment.y * segment.y;

        if (segmentLengthSq === 0) {
            return point.distanceTo(start);
        }

        const pointFromStart = start.vecTo(point);
        const projection = Math.max(
            0,
            Math.min(1, pointFromStart.dot(segment) / segmentLengthSq)
        );
        const closestPoint = new Vec2(
            start.x + segment.x * projection,
            start.y + segment.y * projection
        );

        return point.distanceTo(closestPoint);
    }

    private sameTile(a: Vec2, b: Vec2): boolean {
        return a.x === b.x && a.y === b.y;
    }

    private randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    private getPhaseEndFadeT(phase: VineWavePhase, elapsed: number): number {
        const fadeDuration = phase.endFadeDuration ?? 2;

        if (fadeDuration <= 0) {
            return 0;
        }

        const fadeStart = Math.max(0, phase.duration - fadeDuration);
        const t = (elapsed - fadeStart) / fadeDuration;

        return Math.max(0, Math.min(t, 1));
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }
}
