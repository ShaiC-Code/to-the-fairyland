import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import AABB from "../../../Wolfie2D/DataTypes/Shapes/AABB";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Scene from "../../../Wolfie2D/Scene/Scene";
import PlayerActor from "../../Actors/PlayerActor";
import PlayerAI from "../../AI/Player/PlayerAI";
import { PlayerControlMode } from "../../AI/Player/PlayerController";
import { PlayerStateType } from "../../AI/Player/PlayerStates/PlayerBehaviorState";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Receiver from "../../../Wolfie2D/Events/Receiver";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";

export type PlayerAttackHitbox = {
    weapon: "excalibur";
    damage: number;
    originTile: Vec2;
    direction: Vec2;
    tiles: Vec2[];
    bounds: AABB;
};

type PlayerAttackControllerOptions = {
    scene: Scene;
    player: PlayerActor;
    ground: OrthogonalTilemap;
    effectLayerName: string;
    swordAttackSpriteKey: string;
    getHasExcalibur: () => boolean;
    onHitboxActive?: (hitbox: PlayerAttackHitbox) => void;
    onDashComplete?: (endTile: Vec2, tiles: Vec2[]) => void;
    canAttack?: () => boolean;
    clampDashTiles?: (tiles: Vec2[], originTile: Vec2, direction: Vec2) => Vec2[];
};

export default class PlayerAttackController {
    private readonly scene: Scene;
    private readonly player: PlayerActor;
    private readonly ground: OrthogonalTilemap;
    private readonly effectLayerName: string;
    private readonly swordAttackSpriteKey: string;
    private readonly getHasExcalibur: () => boolean;
    private readonly onHitboxActive?: (hitbox: PlayerAttackHitbox) => void;
    private readonly onDashComplete?: (endTile: Vec2, tiles: Vec2[]) => void;
    private readonly canAttack: () => boolean;
    private readonly clampDashTiles: (tiles: Vec2[], originTile: Vec2, direction: Vec2) => Vec2[];

    private readonly dashTileCount = 2;
    private readonly dashDuration = 0.14;
    private readonly startupDuration = 0.04;
    private readonly recoveryDuration = 0.08;
    private readonly minimumAttackDuration = 0.32;
    private readonly effectForwardOffsetTiles = 1;
    private readonly damage = 1;
    private readonly swordAttackEndEvent = "SwordAttackEnd";

    private readonly effectRightOffset = new Vec2(0, 20);
    private readonly effectLeftOffset = new Vec2(0, 20);
    private readonly effectUpOffset = new Vec2(0, 20);
    private readonly effectDownOffset = new Vec2(0, 20);
    private readonly effectUpRightOffset = new Vec2(-10, 40);
    private readonly effectUpLeftOffset = new Vec2(10, 40);
    private readonly effectDownRightOffset = new Vec2(-25, 10);
    private readonly effectDownLeftOffset = new Vec2(25, 15);

    private readonly animationReceiver = new Receiver();

    private attacking = false;
    private attackElapsed = 0;
    private hitboxStarted = false;
    private attackEffect: AnimatedSprite | null = null;
    private activeDirection = Vec2.DOWN;
    private attackOriginTile = Vec2.ZERO;
    private attackTiles: Vec2[] = [];
    private dashActive = false;
    private dashStartPosition = Vec2.ZERO;
    private dashEndPosition = Vec2.ZERO;
    private dashEndTile = Vec2.ZERO;

    public constructor(options: PlayerAttackControllerOptions) {
        this.scene = options.scene;
        this.player = options.player;
        this.ground = options.ground;
        this.effectLayerName = options.effectLayerName;
        this.swordAttackSpriteKey = options.swordAttackSpriteKey;
        this.getHasExcalibur = options.getHasExcalibur;
        this.onHitboxActive = options.onHitboxActive;
        this.onDashComplete = options.onDashComplete;
        this.canAttack = options.canAttack ?? (() => true);
        this.clampDashTiles = options.clampDashTiles ?? ((tiles) => tiles);
        this.animationReceiver.subscribe(this.swordAttackEndEvent);
    }

    public isAttacking(): boolean {
        return this.attacking;
    }

    public update(deltaT: number): void {
        const ai = this.getPlayerAI();

        if (!this.attacking && this.canAttack() && this.getHasExcalibur() && ai.controller.attacking) {
            this.startExcaliburAttack();
        }

        this.handleAnimationEvents();

        if (!this.attacking) {
            return;
        }

        this.attackElapsed += deltaT;
        this.updateDash();
        this.updateAttackEffect();

        if (!this.hitboxStarted && this.attackElapsed >= this.startupDuration) {
            this.hitboxStarted = true;
            this.onHitboxActive?.(this.createHitbox());
        }

        if (this.attackElapsed >= this.getTotalAttackDuration()) {
            this.finishAttack();
        }
    }

    private startExcaliburAttack(): void {
        if (this.attacking) {
            return;
        }

        const ai = this.getPlayerAI();

        this.attacking = true;
        this.attackElapsed = 0;
        this.hitboxStarted = false;
        this.activeDirection = ai.facing.clone();
        this.attackOriginTile = ai.currentTile.clone();
        const reachableDashTiles = this.getReachableDashTiles(this.attackOriginTile, this.activeDirection);

        this.attackTiles = this.clampDashTiles(
            reachableDashTiles.map(tile => tile.clone()),
            this.attackOriginTile.clone(),
            this.activeDirection.clone()
        ).map(tile => tile.clone());

        ai.controller.setControlMode(PlayerControlMode.LOCKED);
        this.beginDash();
        this.spawnAttackEffect();
    }

    private beginDash(): void {
        const ai = this.getPlayerAI();

        this.dashStartPosition = this.player.position.clone();
        this.dashEndTile = this.attackTiles[this.attackTiles.length - 1]?.clone() ?? this.attackOriginTile.clone();

        const dashEndTileCenter = this.ground.getTileCenter(this.dashEndTile.x, this.dashEndTile.y);
        this.dashEndPosition = this.player.getCenterForFeetPosition(
            dashEndTileCenter.x,
            dashEndTileCenter.y
        );

        ai.onMoveComplete = null;
        ai.changeState(PlayerStateType.IDLE);
        ai.targetTile = null;
        ai.moving = false;
        ai.moveProgress = 0;
        ai.moveStart = this.dashStartPosition.clone();
        ai.moveEnd = this.dashEndPosition.clone();
        ai.currentMoveDuration = this.dashDuration;

        this.dashActive = true;
    }

    private updateDash(): void {
        if (!this.dashActive) {
            return;
        }

        const t = Math.min(this.attackElapsed / this.dashDuration, 1);
        const easedT = Math.sin((t * Math.PI) / 2);

        this.player.position.copy(
            Vec2.lerp(this.dashStartPosition, this.dashEndPosition, easedT)
        );
        this.player.setSortTile(
            this.ground.getTilemapPosition(this.player.position.x, this.player.position.y)
        );

        if (t >= 1) {
            this.finishDash();
        }
    }

    private finishDash(): void {
        const ai = this.getPlayerAI();

        this.dashActive = false;
        this.player.position.copy(this.dashEndPosition);
        this.player.setSortTile(this.dashEndTile);

        ai.currentTile = this.dashEndTile.clone();
        ai.changeState(PlayerStateType.IDLE);
        ai.targetTile = null;
        ai.moveStart = this.dashEndPosition.clone();
        ai.moveEnd = this.dashEndPosition.clone();
        ai.moveProgress = 0;
        ai.currentMoveDuration = ai.moveDuration;
        ai.moving = false;

        this.onDashComplete?.(this.dashEndTile.clone(), this.getAttackTiles());
    }

    private finishAttack(): void {
        const ai = this.getPlayerAI();

        if (this.dashActive) {
            this.finishDash();
        }

        this.hideAttackEffect();
        this.attacking = false;
        this.attackElapsed = 0;
        this.hitboxStarted = false;
        this.attackTiles = [];
        ai.controller.setControlMode(PlayerControlMode.GAMEPLAY);
    }

    private spawnAttackEffect(): void {
        if (!this.attackEffect) {
            this.attackEffect = this.scene.add.animatedSprite(
                AnimatedSprite,
                this.swordAttackSpriteKey,
                this.effectLayerName
            );

            this.attackEffect.setSortOrder(30);
        }

        this.attackEffect.visible = true;
        this.attackEffect.alpha = 1;
        this.attackEffect.rotation = Vec2.UP.angleToCCW(this.activeDirection);
        this.attackEffect.animation.playAndHoldFinalFrame("Attack", false, this.swordAttackEndEvent);

        this.updateAttackEffect();
    }

    private updateAttackEffect(): void {
        if (!this.attackEffect || !this.attackEffect.visible) {
            return;
        }

        const tileSize = this.ground.getScaledTileSize();
        const forwardOffset = Math.max(tileSize.x, tileSize.y) * this.effectForwardOffsetTiles;
        const effectPosition = this.player.position.clone()
            .add(this.activeDirection.clone().scale(forwardOffset))
            .add(this.getEffectDirectionOffset(this.activeDirection));

        this.attackEffect.position.copy(effectPosition);
        this.attackEffect.setSortTile(this.ground.getTilemapPosition(effectPosition.x, effectPosition.y));
    }

    private getEffectDirectionOffset(direction: Vec2): Vec2 {
        if (direction.x > 0 && direction.y < 0) {
            return this.effectUpRightOffset.clone();
        }

        if (direction.x < 0 && direction.y < 0) {
            return this.effectUpLeftOffset.clone();
        }

        if (direction.x > 0 && direction.y > 0) {
            return this.effectDownRightOffset.clone();
        }

        if (direction.x < 0 && direction.y > 0) {
            return this.effectDownLeftOffset.clone();
        }

        if (direction.x > 0 && direction.y === 0) {
            return this.effectRightOffset.clone();
        }

        if (direction.x < 0 && direction.y === 0) {
            return this.effectLeftOffset.clone();
        }

        if (direction.y < 0 && direction.x === 0) {
            return this.effectUpOffset.clone();
        }

        if (direction.y > 0 && direction.x === 0) {
            return this.effectDownOffset.clone();
        }

        return Vec2.ZERO;
    }

    private hideAttackEffect(): void {
        if (!this.attackEffect) {
            return;
        }

        this.attackEffect.visible = false;
        this.attackEffect.animation.stop();
    }

    private handleAnimationEvents(): void {
        while (this.animationReceiver.hasNextEvent()) {
            const event = this.animationReceiver.getNextEvent();

            if (event.type === this.swordAttackEndEvent) {
                this.handleSwordAttackAnimationEnd(event);
            }
        }
    }

    private handleSwordAttackAnimationEnd(event: GameEvent): void {
        if (!this.attackEffect) {
            return;
        }

        if (event.data.get("owner") !== this.attackEffect.id) {
            return;
        }

        this.hideAttackEffect();
    }

    private createHitbox(): PlayerAttackHitbox {
        const tiles = this.getAttackTiles();
        const tileSize = this.ground.getScaledTileSize();
        const firstTile = tiles[0] ?? this.attackOriginTile;
        const lastTile = tiles[tiles.length - 1] ?? this.attackOriginTile;
        const firstCenter = this.ground.getTileCenter(firstTile.x, firstTile.y);
        const lastCenter = this.ground.getTileCenter(lastTile.x, lastTile.y);
        const center = Vec2.lerp(firstCenter, lastCenter, 0.5);
        const isHorizontal = Math.abs(this.activeDirection.x) > 0;
        const coveredTileCount = Math.max(tiles.length, 1);

        return {
            weapon: "excalibur",
            damage: this.damage,
            originTile: this.attackOriginTile.clone(),
            direction: this.activeDirection.clone(),
            tiles,
            bounds: new AABB(
                center,
                isHorizontal
                    ? new Vec2(tileSize.x * coveredTileCount / 2, tileSize.y / 2)
                    : new Vec2(tileSize.x / 2, tileSize.y * coveredTileCount / 2)
            )
        };
    }

    private getAttackTiles(): Vec2[] {
        return this.attackTiles.map(tile => tile.clone());
    }

    private getReachableDashTiles(originTile: Vec2, direction: Vec2): Vec2[] {
        const ai = this.getPlayerAI();
        const tiles: Vec2[] = [];
        let cursor = originTile.clone();

        const isDiagonal = direction.x !== 0 && direction.y !== 0;
        const bonusDashTile = ai.moving && ai.moveProgress > 0.5 && !isDiagonal ? 1 : 0;
        const maxDashTiles = this.dashTileCount + bonusDashTile;

        for (let i = 0; i < maxDashTiles; i++) {
            if (!ai.canMoveToTile(cursor, direction)) {
                break;
            }

            cursor = cursor.clone().add(direction);
            tiles.push(cursor.clone());
        }

        return tiles;
    }

    private getTotalAttackDuration(): number {
        return Math.max(this.dashDuration, this.minimumAttackDuration) + this.recoveryDuration;
    }

    private getPlayerAI(): PlayerAI {
        return this.player.ai as PlayerAI;
    }
}
