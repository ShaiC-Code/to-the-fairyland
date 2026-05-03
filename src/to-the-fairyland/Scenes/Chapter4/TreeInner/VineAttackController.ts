import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import { TiledObject } from "../../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import OrthogonalTilemap from "../../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../../../Wolfie2D/Scene/Scene";
import type { PlayerAttackHitbox } from "../../../GameSystems/CombatSystem/PlayerAttackController";
import type { SwordHitTarget } from "../../../GameSystems/CombatSystem/SwordHitDispatcher";
import AudioController from "../../../GameSystems/AudioController";

export type VineAttackType = "normal" | "exit";

export type VineAttack = {
    type: VineAttackType;
    start: Vec2;
    end: Vec2;
    direction: Vec2;
    distance: number;
    speed: number;
    spriteKey: string;
    progress: number;
    parts: Sprite[];
    blockedTiles: Vec2[];
    blocksTiles: boolean;
};

export type VineAttackOptions = {
    type?: VineAttackType;
    blocksTiles?: boolean;
    speed?: number;
    spriteKey?: string;
};

type VineAttackControllerOptions = {
    scene: Scene;
    ground: OrthogonalTilemap;
    collision: OrthogonalTilemap;
    layerName: string;
    defaultSpriteKey: string;
    defaultSpeed?: number;
    partSpacing?: number;
    partRotationOffset?: number;
    dynamicCollisionTileId?: number;
    swordAttackHitSFXKey?: string;
};

export default class VineAttackController implements SwordHitTarget {
    private activeVineAttacks: VineAttack[] = [];
    private dynamicCollisionTiles: Map<string, { tile: Vec2; previousTile: number; count: number }> = new Map();

    private readonly scene: Scene;
    private readonly ground: OrthogonalTilemap;
    private readonly collision: OrthogonalTilemap;
    private readonly layerName: string;
    private readonly defaultSpriteKey: string;
    private readonly defaultSpeed: number;
    private readonly partSpacing: number;
    private readonly partRotationOffset: number;
    private readonly dynamicCollisionTileId: number;
    private readonly swordAttackHitSFXKey?: string;

    public constructor(options: VineAttackControllerOptions) {
        this.scene = options.scene;
        this.ground = options.ground;
        this.collision = options.collision;
        this.layerName = options.layerName;
        this.defaultSpriteKey = options.defaultSpriteKey;
        this.defaultSpeed = options.defaultSpeed ?? 600;
        this.partSpacing = options.partSpacing ?? 30;
        this.partRotationOffset = options.partRotationOffset ?? 0;
        this.dynamicCollisionTileId = options.dynamicCollisionTileId ?? 1;
        this.swordAttackHitSFXKey = options.swordAttackHitSFXKey;
    }

    public startFromObjects(startObj: TiledObject, endObj: TiledObject, options: VineAttackOptions = {}): void {
        const attack = this.createAttackFromObjects(startObj, endObj, options);

        if (!attack) {
            return;
        }

        this.activeVineAttacks.push(attack);
    }

    public startCompleteFromObjects(startObj: TiledObject, endObj: TiledObject, options: VineAttackOptions = {}): void {
        const attack = this.createAttackFromObjects(startObj, endObj, options);

        if (!attack) {
            return;
        }

        attack.progress = attack.distance;
        this.activeVineAttacks.push(attack);
        this.ensureVinePartCount(attack);
        this.positionVineParts(attack);

        if (attack.blocksTiles) {
            this.blockTilesCrossedByVine(attack);
        }
    }

    private createAttackFromObjects(startObj: TiledObject, endObj: TiledObject, options: VineAttackOptions = {}): VineAttack | null {
        const start = new Vec2(startObj.x, startObj.y);
        const end = new Vec2(endObj.x, endObj.y);
        const toEnd = start.vecTo(end);
        const distance = toEnd.mag();

        if (distance <= 0) {
            return null;
        }

        return {
            type: options.type ?? "normal",
            start,
            end,
            direction: toEnd.normalize(),
            distance,
            speed: options.speed ?? this.defaultSpeed,
            spriteKey: options.spriteKey ?? this.defaultSpriteKey,
            progress: 0,
            parts: [],
            blockedTiles: [],
            blocksTiles: options.blocksTiles ?? false
        };
    }

    public update(deltaT: number): void {
        for (const attack of this.activeVineAttacks) {
            if (attack.progress >= attack.distance) {
                continue;
            }

            attack.progress = Math.min(
                attack.progress + attack.speed * deltaT,
                attack.distance
            );

            this.ensureVinePartCount(attack);
            this.positionVineParts(attack);

            if (attack.blocksTiles) {
                this.blockTilesCrossedByVine(attack);
            }
        }
    }

    public destroyMatching(shouldDestroy: (attack: VineAttack) => boolean): void {
        const remainingAttacks: VineAttack[] = [];

        for (const attack of this.activeVineAttacks) {
            if (!shouldDestroy(attack)) {
                remainingAttacks.push(attack);
                continue;
            }

            for (const part of attack.parts) {
                part.destroy();
            }

            this.unblockDynamicCollisionTiles(attack.blockedTiles);
        }

        this.activeVineAttacks = remainingAttacks;
    }
    
    public handleSwordHit(hitbox: PlayerAttackHitbox): void {
        const playerHitTiles = this.getPlayerAttackPathTileSet(hitbox);

        const vinesHit = this.activeVineAttacks.filter(attack =>
            attack.type === "normal" &&
            attack.progress > 0 &&
            this.currentVineTouchesAnyTile(attack, playerHitTiles)
        );

        if (vinesHit.length > 0) {
            if (this.swordAttackHitSFXKey) {
                AudioController.getInstance().playSFX(this.swordAttackHitSFXKey);
            }
        }
    
        this.destroyMatching(attack => vinesHit.includes(attack));
    }
    
    private getPlayerAttackPathTileSet(hitbox: PlayerAttackHitbox): Set<string> {
        const endTile = hitbox.tiles[hitbox.tiles.length - 1] ?? hitbox.originTile;
    
        const start = this.ground.getTileCenter(hitbox.originTile.x, hitbox.originTile.y);
        const end = this.ground.getTileCenter(endTile.x, endTile.y);
    
        return new Set(
            this.getTilesCrossedByWorldSegment(start, end)
                .map(tile => this.tileKey(tile))
        );
    }
    
    private currentVineTouchesAnyTile(attack: VineAttack, hitTiles: Set<string>): boolean {
        const currentTip = new Vec2(
            attack.start.x + attack.direction.x * attack.progress,
            attack.start.y + attack.direction.y * attack.progress
        );
    
        const vineTiles = this.getTilesCrossedByWorldSegment(attack.start, currentTip);
    
        return vineTiles.some(tile => hitTiles.has(this.tileKey(tile)));
    }
    
    public getTilesCrossedByWorldSegment(start: Vec2, end: Vec2): Vec2[] {
        const distance = start.distanceTo(end);
        const tileSize = this.ground.getScaledTileSize();
        const sampleSpacing = Math.max(1, Math.min(tileSize.x, tileSize.y) / 4);
        const sampleCount = Math.max(1, Math.ceil(distance / sampleSpacing));
        const tiles = new Map<string, Vec2>();

        for (let i = 0; i <= sampleCount; i++) {
            const t = i / sampleCount;
            const point = Vec2.lerp(start, end, t);
            const tile = this.ground.getTilemapPosition(point.x, point.y);
            tiles.set(this.tileKey(tile), tile);
        }

        return Array.from(tiles.values());
    }

    private ensureVinePartCount(attack: VineAttack): void {
        const neededParts = Math.ceil(attack.progress / this.partSpacing);

        while (attack.parts.length < neededParts) {
            const part = this.scene.add.sprite(
                attack.spriteKey,
                this.layerName
            );

            part.alpha = 1;
            part.setSortOrder(4);
            attack.parts.push(part);
        }
    }

    private positionVineParts(attack: VineAttack): void {
        const angle = Math.atan2(attack.direction.y, attack.direction.x);

        for (let i = 0; i < attack.parts.length; i++) {
            const part = attack.parts[i];
            const partDistance = attack.progress - i * this.partSpacing;

            if (partDistance < 0) {
                part.visible = false;
                continue;
            }

            const visibleLength = Math.min(this.partSpacing, partDistance);
            const visibleRatio = visibleLength / this.partSpacing;
            const centerDistance = partDistance - visibleLength / 2;

            part.visible = true;
            part.scale.set(visibleRatio, 1);

            part.position.set(
                attack.start.x + attack.direction.x * centerDistance,
                attack.start.y + attack.direction.y * centerDistance
            );

            part.rotation = -angle + this.partRotationOffset;
            part.setSortTile(this.ground.getTilemapPosition(part.position.x, part.position.y));
        }
    }

    private blockTilesCrossedByVine(attack: VineAttack): void {
        const currentTip = new Vec2(
            attack.start.x + attack.direction.x * attack.progress,
            attack.start.y + attack.direction.y * attack.progress
        );
        const crossedTiles = this.getTilesCrossedByWorldSegment(attack.start, currentTip);
        const alreadyBlockedByAttack = new Set(attack.blockedTiles.map(tile => this.tileKey(tile)));

        for (const tile of crossedTiles) {
            if (alreadyBlockedByAttack.has(this.tileKey(tile))) {
                continue;
            }

            this.blockDynamicCollisionTile(tile);
            attack.blockedTiles.push(tile.clone());
        }
    }

    private blockDynamicCollisionTile(tile: Vec2): void {
        const key = this.tileKey(tile);
        const existing = this.dynamicCollisionTiles.get(key);

        if (existing) {
            existing.count += 1;
            return;
        }

        const previousTile = this.collision.getTile(tile.x, tile.y);

        if (previousTile === -1) {
            return;
        }

        this.dynamicCollisionTiles.set(key, {
            tile: tile.clone(),
            previousTile,
            count: 1
        });
        this.collision.setTile(tile.x, tile.y, this.dynamicCollisionTileId);
    }

    private unblockDynamicCollisionTiles(tiles: Vec2[]): void {
        for (const tile of tiles) {
            this.unblockDynamicCollisionTile(tile);
        }
    }

    private unblockDynamicCollisionTile(tile: Vec2): void {
        const key = this.tileKey(tile);
        const existing = this.dynamicCollisionTiles.get(key);

        if (!existing) {
            return;
        }

        existing.count -= 1;

        if (existing.count > 0) {
            return;
        }

        this.collision.setTile(existing.tile.x, existing.tile.y, existing.previousTile);
        this.dynamicCollisionTiles.delete(key);
    }

    private tileKey(tile: Vec2): string {
        return `${tile.x},${tile.y}`;
    }
}
