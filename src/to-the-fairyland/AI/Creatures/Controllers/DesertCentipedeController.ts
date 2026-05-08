import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Scene from "../../../../Wolfie2D/Scene/Scene";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";

type DesertCentipedeSegmentRole = "head" | "body" | "tail";

type DesertCentipedeSpriteKeys = {
    head: string;
    body: string;
    tail: string;
};

type DesertCentipedeSegment = {
    role: DesertCentipedeSegmentRole;
    sprite: Sprite;
    lastFramePosition: Vec2;
    lastDirection: Vec2;
};

type DesertCentipedeMoveMode = "approach" | "aggro" | "guidedCharge" | "charge";

export type DesertCentipedeOptions = {
    scene: Scene;
    layerName: string;
    startPosition: Vec2;
    facing?: string;
    bodySegments: number;
    spriteKeys: DesertCentipedeSpriteKeys;
    segmentSpacing?: number;
    headToBodySegmentSpacing?: number;
    bodyToBodySegmentSpacing?: number;
    bodyToTailSegmentSpacing?: number;
    moveSpeed?: number;
    chargeMoveSpeed?: number;
    headSteerTurnSpeed?: number;
    aggroStartDistance?: number;
    aggroDuration?: number;
    minAggroDuration?: number;
    maxAggroDuration?: number;
    chargeGuidanceDuration?: number;
    chargeDuration?: number;
    maxTurnSpeed?: number;
    rotationOffset?: number;
    scale?: number;
};

export default class DesertCentipedeController {
    private readonly scene: Scene;
    private readonly layerName: string;
    private readonly spriteKeys: DesertCentipedeSpriteKeys;
    private readonly headToBodySegmentSpacing: number;
    private readonly bodyToBodySegmentSpacing: number;
    private readonly bodyToTailSegmentSpacing: number;
    private readonly moveSpeed: number;
    private readonly chargeMoveSpeed: number;
    private readonly headSteerTurnSpeed: number;
    private readonly aggroStartDistance: number;
    private readonly minAggroDuration: number;
    private readonly maxAggroDuration: number;
    private readonly chargeGuidanceDuration: number;
    private readonly chargeDuration: number;
    private readonly maxTurnSpeed: number;
    private readonly rotationOffset: number;
    private readonly scale: number;
    private readonly segmentSortTile = Vec2.ZERO;

    private readonly segments: DesertCentipedeSegment[] = [];
    private moveMode: DesertCentipedeMoveMode = "approach";
    private moveModeTimer = 0;

    public constructor(options: DesertCentipedeOptions) {
        this.scene = options.scene;
        this.layerName = options.layerName;
        this.spriteKeys = options.spriteKeys;
        this.headToBodySegmentSpacing = options.headToBodySegmentSpacing ?? options.segmentSpacing ?? 48;
        this.bodyToBodySegmentSpacing = options.bodyToBodySegmentSpacing ?? options.segmentSpacing ?? 48;
        this.bodyToTailSegmentSpacing = options.bodyToTailSegmentSpacing ?? options.segmentSpacing ?? 48;
        this.moveSpeed = options.moveSpeed ?? 120;
        this.chargeMoveSpeed = options.chargeMoveSpeed ?? this.moveSpeed * 1.5;
        this.headSteerTurnSpeed = options.headSteerTurnSpeed ?? Math.PI * 1.5;
        this.aggroStartDistance = options.aggroStartDistance ?? 360;
        this.minAggroDuration = options.minAggroDuration ?? options.aggroDuration ?? 0.85;
        this.maxAggroDuration = Math.max(
            this.minAggroDuration,
            options.maxAggroDuration ?? options.aggroDuration ?? this.minAggroDuration
        );
        this.chargeGuidanceDuration = options.chargeGuidanceDuration ?? 0;
        this.chargeDuration = options.chargeDuration ?? 1.35;
        this.maxTurnSpeed = options.maxTurnSpeed ?? Math.PI * 4;
        this.rotationOffset = options.rotationOffset ?? 0;
        this.scale = options.scale ?? 1;
    
        const bodySegments = Math.max(1, Math.floor(options.bodySegments));
        const initialDirection = this.getDirectionFromFacing(options.facing);
    
        // Create all centipede segments 
        this.createSegment("head", this.spriteKeys.head, options.startPosition, initialDirection);

        for (let i = 0; i < bodySegments; i++) {
            this.createSegment("body", this.spriteKeys.body, options.startPosition, initialDirection);
        }

        this.createSegment("tail", this.spriteKeys.tail, options.startPosition, initialDirection);
        this.applySortOrders();
    }

    public update(deltaT: number, targetPosition: Vec2): void {
        this.cacheLastFramePositions();
        this.moveHeadToward(targetPosition, deltaT);
        this.followChain();
        this.updateRotations(deltaT);
    }

    private createSegment(
        role: DesertCentipedeSegmentRole,
        spriteKey: string,
        position: Vec2,
        direction: Vec2
    ): void {
        const sprite = this.scene.add.sprite(spriteKey, this.layerName);

        sprite.position.copy(position);
        sprite.scale.set(this.scale, this.scale);
        sprite.rotation = this.getRotationForDirection(direction);
        sprite.setSortTile(this.segmentSortTile);

        this.segments.push({
            role,
            sprite,
            lastFramePosition: position.clone(),
            lastDirection: direction.clone()
        });
    }

    private applySortOrders(): void {
        const total = this.segments.length;

        for (let i = 0; i < total; i++) {
            this.segments[i].sprite.setSortOrder(total - 1 - i);
        }
    }

    private cacheLastFramePositions(): void {
        for (const segment of this.segments) {
            segment.lastFramePosition.copy(segment.sprite.position);
        }
    }

    private moveHeadToward(targetPosition: Vec2, deltaT: number): void {
        const head = this.segments[0];
        const toTarget = head.sprite.position.vecTo(targetPosition);
        const distance = toTarget.mag();

        this.updateMoveMode(distance, deltaT);

        if (this.moveMode === "charge") {
            this.moveHeadForward(head, deltaT);
            return;
        }

        if (distance <= 0.001) {
            return;
        }

        const desiredDirection = toTarget.scale(1 / distance);
        const currentDirection = head.lastDirection.clone().normalize();
        const currentAngle = Math.atan2(currentDirection.y, currentDirection.x);
        const desiredAngle = Math.atan2(desiredDirection.y, desiredDirection.x);
        const nextAngle = this.rotateToward(
            currentAngle,
            desiredAngle,
            this.headSteerTurnSpeed * deltaT
        );
        const direction = new Vec2(Math.cos(nextAngle), Math.sin(nextAngle));
        this.moveHeadInDirection(
            head,
            direction,
            deltaT,
            this.moveMode === "guidedCharge" ? this.chargeMoveSpeed : this.moveSpeed
        );
    }

    private updateMoveMode(distanceToTarget: number, deltaT: number): void {
        switch (this.moveMode) {
            case "approach":
                if (distanceToTarget <= this.aggroStartDistance) {
                    this.moveMode = "aggro";
                    this.moveModeTimer = this.getRandomAggroDuration();
                }
                break;
            case "aggro":
                this.moveModeTimer -= deltaT;
                if (this.moveModeTimer <= 0) {
                    this.startCharge();
                }
                break;
            case "guidedCharge":
                this.moveModeTimer -= deltaT;
                if (this.moveModeTimer <= 0) {
                    this.moveMode = "charge";
                    this.moveModeTimer = this.chargeDuration;
                }
                break;
            case "charge":
                this.moveModeTimer -= deltaT;
                if (this.moveModeTimer <= 0) {
                    this.moveMode = "approach";
                    this.moveModeTimer = 0;
                }
                break;
        }
    }

    private startCharge(): void {
        if (this.chargeGuidanceDuration > 0) {
            this.moveMode = "guidedCharge";
            this.moveModeTimer = this.chargeGuidanceDuration;
            return;
        }

        this.moveMode = "charge";
        this.moveModeTimer = this.chargeDuration;
    }

    private getRandomAggroDuration(): number {
        return this.minAggroDuration + Math.random() * (
            this.maxAggroDuration - this.minAggroDuration
        );
    }

    private moveHeadForward(head: DesertCentipedeSegment, deltaT: number): void {
        const direction = head.lastDirection.clone().normalize();
        this.moveHeadInDirection(head, direction, deltaT, this.chargeMoveSpeed);
    }

    private moveHeadInDirection(
        head: DesertCentipedeSegment,
        direction: Vec2,
        deltaT: number,
        moveSpeed = this.moveSpeed
    ): void {
        const stepDistance = moveSpeed * deltaT;
        head.sprite.position.add(direction.scaled(stepDistance));
        head.lastDirection.copy(direction);
    }

    private followChain(): void {
        for (let i = 1; i < this.segments.length; i++) {
            const previous = this.segments[i - 1];
            const current = this.segments[i];
            const segmentSpacing = this.getSegmentSpacing(previous, current);

            const toPrevious = current.sprite.position.vecTo(previous.sprite.position);
            const distance = toPrevious.mag();

            if (distance <= segmentSpacing || distance <= 0.001) {
                continue;
            }

            const direction = toPrevious.scale(1 / distance);
            const pullDistance = distance - segmentSpacing;

            current.sprite.position.add(direction.scaled(pullDistance));
            current.lastDirection.copy(direction);
        }
    }

    private getSegmentSpacing(previous: DesertCentipedeSegment, current: DesertCentipedeSegment): number {
        if (previous.role === "head" && current.role === "body") {
            return this.headToBodySegmentSpacing;
        }

        if (current.role === "tail") {
            return this.bodyToTailSegmentSpacing;
        }

        return this.bodyToBodySegmentSpacing;
    }

    private updateRotations(deltaT: number): void {
        const maxStep = this.maxTurnSpeed * deltaT;

        for (let i = 0; i < this.segments.length; i++) {
            const direction = this.getSegmentRotationDirection(i);

            if (direction.magSq() <= 0.0001) {
                continue;
            }

            const targetRotation = this.getRotationForDirection(direction.normalize());
            const sprite = this.segments[i].sprite;

            sprite.rotation = this.rotateToward(sprite.rotation, targetRotation, maxStep);
            this.segments[i].lastDirection.copy(direction);
        }
    }

    private getSegmentRotationDirection(index: number): Vec2 {
        const segment = this.segments[index];

        if (segment.role === "head") {
            const movementDirection = segment.lastFramePosition.vecTo(segment.sprite.position);

            if (movementDirection.magSq() > 0.0001) {
                return movementDirection;
            }

            return segment.lastDirection.clone();
        }

        if (segment.role === "tail") {
            const previous = this.segments[index - 1];
            return segment.sprite.position.vecTo(previous.sprite.position);
        }

        const previous = this.segments[index - 1];
        const next = this.segments[index + 1];

        return next.sprite.position.vecTo(previous.sprite.position);
    }

    private getRotationForDirection(direction: Vec2): number {
        return -Math.atan2(direction.y, direction.x) + this.rotationOffset;
    }

    private rotateToward(current: number, target: number, maxStep: number): number {
        const delta = Math.atan2(
            Math.sin(target - current),
            Math.cos(target - current)
        );

        const clampedDelta = Math.max(-maxStep, Math.min(maxStep, delta));
        return current + clampedDelta;
    }

    private getDirectionFromFacing(facing: string | undefined): Vec2 {
        if (facing === "up") return Vec2.UP;
        if (facing === "left") return Vec2.LEFT;
        if (facing === "right") return Vec2.RIGHT;
        return Vec2.DOWN;
    }
}
